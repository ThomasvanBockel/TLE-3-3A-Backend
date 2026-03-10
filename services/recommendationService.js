import mongoose from "mongoose";
import { pipeline } from "@huggingface/transformers";
import User from "../models/User.js";
import Category from "../models/Category.js";
import ContentItem from "../models/ContentItem.js";
import ContentCategory from "../models/ContentCategory.js";
import UserInterest from "../models/UserInterest.js";
import RecommendationRun from "../models/RecommendationRun.js";
import RecommendationItem from "../models/RecommendationItem.js";

let extractorPromise = null;
const embeddingCache = new Map();

function cosineSimilarity(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
        return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
        const av = Number(a[i]) || 0;
        const bv = Number(b[i]) || 0;
        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function normalizeWeight(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return 1;
    return Math.min(parsed, 10);
}

async function getExtractor() {
    if (!extractorPromise) {
        extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
            device: "cpu",
            dtype: "fp32"
        });
    }
    return extractorPromise;
}

async function embedText(text) {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) return [];

    if (embeddingCache.has(normalizedText)) {
        return embeddingCache.get(normalizedText);
    }

    const extractor = await getExtractor();
    const output = await extractor(normalizedText, {
        pooling: "mean",
        normalize: true
    });

    const vector = Array.from(output.data || []);
    embeddingCache.set(normalizedText, vector);
    return vector;
}

function weightedAverage(vectors, weights) {
    if (!vectors.length) return [];

    const dimension = vectors[0].length;
    const sum = new Array(dimension).fill(0);

    let totalWeight = 0;
    for (let i = 0; i < vectors.length; i += 1) {
        const weight = weights[i] || 0;
        if (!weight || vectors[i].length !== dimension) continue;

        totalWeight += weight;
        for (let j = 0; j < dimension; j += 1) {
            sum[j] += vectors[i][j] * weight;
        }
    }

    if (totalWeight === 0) return [];
    return sum.map((value) => value / totalWeight);
}

async function buildUserProfileVector(userId) {
    const interests = await UserInterest.find({ user_id: userId }).lean();
    if (!interests.length) return [];

    const categoryIds = interests.map((interest) => interest.category_id);
    const categories = await Category.find({ _id: { $in: categoryIds } }).select("name").lean();
    const nameById = new Map(categories.map((category) => [String(category._id), category.name]));

    const vectors = [];
    const weights = [];

    for (const interest of interests) {
        const categoryName = nameById.get(String(interest.category_id));
        if (!categoryName) continue;

        const text = `Interesse in ${categoryName}`;
        const vector = await embedText(text);
        if (!vector.length) continue;

        vectors.push(vector);
        weights.push(normalizeWeight(interest.weight));
    }

    return weightedAverage(vectors, weights);
}

function buildContentText(item, categories = []) {
    const categoryText = categories.length ? `Categorieen: ${categories.join(", ")}` : "";
    return `${item.title || ""}. ${item.body || ""}. ${categoryText}`.trim();
}

function getFreshnessBoost(createdAt) {
    if (!createdAt) return 0;
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays < 3) return 0.08;
    if (ageDays < 7) return 0.05;
    if (ageDays < 14) return 0.03;
    return 0;
}

function getRuleBoost(item, hasPreferredCategory) {
    let boost = 0;
    if (item.is_mandatory) boost += 0.12;
    if (item.is_urgent) boost += 0.08;
    if (hasPreferredCategory) boost += 0.06;
    boost += getFreshnessBoost(item.created_at);

    return boost;
}

function toRecommendationReason(similarity, ruleBoost, preferredCategories = []) {
    return {
        semantic_similarity: Number(similarity.toFixed(6)),
        rule_boost: Number(ruleBoost.toFixed(6)),
        preferred_categories: preferredCategories
    };
}

export async function generateRecommendations({ userId, limit = 10, persist = true, debug = false }) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

    const user = await User.findById(userId).lean();
    if (!user) {
        return { status: 404, payload: { message: "User not found" } };
    }

    const totalContentCount = await ContentItem.countDocuments({});
    const allContent = await ContentItem.find({ status: { $ne: "ARCHIVED" } })
        .select("title body content_type is_urgent is_mandatory created_at starts_at ends_at status")
        .lean();

    if (!allContent.length) {
        const payload = {
            user_id: userId,
            items: [],
            total: 0,
            message: "No eligible content items found for recommendations"
        };

        if (debug) {
            payload.debug = {
                total_content_count: totalContentCount,
                eligible_content_count: 0,
                filter: { status_not_equal: "ARCHIVED" }
            };
        }

        return { status: 200, payload };
    }

    const contentIds = allContent.map((item) => item._id);
    const contentCategories = await ContentCategory.find({ content_id: { $in: contentIds } }).lean();
    const categoryIds = [...new Set(contentCategories.map((cc) => String(cc.category_id)))];
    const categories = await Category.find({ _id: { $in: categoryIds } }).select("name").lean();

    const categoryNameById = new Map(categories.map((category) => [String(category._id), category.name]));
    const categoryIdsByContentId = new Map();

    for (const rel of contentCategories) {
        const contentId = String(rel.content_id);
        const current = categoryIdsByContentId.get(contentId) || [];
        current.push(String(rel.category_id));
        categoryIdsByContentId.set(contentId, current);
    }

    const userInterests = await UserInterest.find({ user_id: userId }).lean();
    const preferredCategoryIdSet = new Set(userInterests.map((interest) => String(interest.category_id)));

    if (user.personalization_enabled === false) {
        const items = allContent
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, safeLimit)
            .map((item, index) => ({
                rank_position: index + 1,
                score: 0,
                content: item,
                reason: { mode: "personalization_disabled" }
            }));

        const payload = {
            status: 200,
            payload: {
                user_id: userId,
                personalization_enabled: false,
                total: items.length,
                items,
                message: "Personalization is disabled for this user, returning newest content"
            }
        };

        if (debug) {
            payload.payload.debug = {
                total_content_count: totalContentCount,
                eligible_content_count: allContent.length,
                user_interests_count: userInterests.length
            };
        }

        return payload;
    }

    const userVector = await buildUserProfileVector(userId);

    const scoredItems = [];
    for (const item of allContent) {
        const categoryIdsForContent = categoryIdsByContentId.get(String(item._id)) || [];
        const categoryNamesForContent = categoryIdsForContent
            .map((id) => categoryNameById.get(String(id)))
            .filter(Boolean);

        const contentText = buildContentText(item, categoryNamesForContent);
        const contentVector = await embedText(contentText);

        const similarity = userVector.length ? cosineSimilarity(userVector, contentVector) : 0;
        const hasPreferredCategory = categoryIdsForContent.some((id) => preferredCategoryIdSet.has(String(id)));
        const ruleBoost = getRuleBoost(item, hasPreferredCategory);

        const combined = clamp01((similarity + 1) / 2 + ruleBoost);

        const preferredCategoryNames = categoryIdsForContent
            .filter((id) => preferredCategoryIdSet.has(String(id)))
            .map((id) => categoryNameById.get(String(id)))
            .filter(Boolean);

        scoredItems.push({
            content: item,
            score: combined,
            reason: toRecommendationReason(similarity, ruleBoost, preferredCategoryNames)
        });
    }

    scoredItems.sort((a, b) => b.score - a.score);
    const topItems = scoredItems.slice(0, safeLimit);

    let run = null;
    if (persist) {
        run = await RecommendationRun.create({ user_id: userId });

        if (topItems.length) {
            await RecommendationItem.insertMany(
                topItems.map((entry, index) => ({
                    run_id: run._id,
                    content_id: entry.content._id,
                    rank_position: index + 1,
                    score: mongoose.Types.Decimal128.fromString(entry.score.toFixed(8)),
                    reason: entry.reason,
                    is_overridden: false
                }))
            );
        }
    }

    const payload = {
        status: 200,
        payload: {
            user_id: userId,
            run_id: run?._id || null,
            personalization_enabled: true,
            total: topItems.length,
            items: topItems.map((entry, index) => ({
                rank_position: index + 1,
                score: Number(entry.score.toFixed(6)),
                content: entry.content,
                reason: entry.reason
            }))
        }
    };

    if (debug) {
        payload.payload.debug = {
            total_content_count: totalContentCount,
            eligible_content_count: allContent.length,
            user_interests_count: userInterests.length,
            preferred_category_count: preferredCategoryIdSet.size
        };
    }

    return payload;
}
