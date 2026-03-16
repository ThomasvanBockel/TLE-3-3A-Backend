import mongoose from "mongoose";
import {pipeline} from "@huggingface/transformers";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import ContentItem from "../../models/ContentItem.js";
import ContentCategory from "../../models/ContentCategory.js";
import UserInterest from "../../models/UserInterest.js";
import RecommendationRun from "../../models/RecommendationRun.js";
import RecommendationItem from "../../models/RecommendationItem.js";

let extractorPromise = null;
const embeddingCache = new Map();

// Compare two vectors and return a similarity score between -1 and 1.
function cosineSimilarity(firstVector = [], secondVector = []) {
    if (!Array.isArray(firstVector) || !Array.isArray(secondVector) || firstVector.length !== secondVector.length || firstVector.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let firstMagnitudeSquared = 0;
    let secondMagnitudeSquared = 0;

    for (let i = 0; i < firstVector.length; i += 1) {
        const firstValue = Number(firstVector[i]) || 0;
        const secondValue = Number(secondVector[i]) || 0;
        dotProduct += firstValue * secondValue;
        firstMagnitudeSquared += firstValue * firstValue;
        secondMagnitudeSquared += secondValue * secondValue;
    }

    if (firstMagnitudeSquared === 0 || secondMagnitudeSquared === 0) return 0;
    return dotProduct / (Math.sqrt(firstMagnitudeSquared) * Math.sqrt(secondMagnitudeSquared));
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function normalizeWeight(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return 1;
    return Math.min(parsed, 10);
}

// Reuse the same model instance across calls.
async function getExtractor() {
    if (!extractorPromise) {
        extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
            device: "cpu",
            dtype: "fp32"
        });
    }
    return extractorPromise;
}

// Convert text to an embedding vector and cache repeated texts.
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

    const vectorLength = vectors[0].length;
    const weightedSums = new Array(vectorLength).fill(0);

    let totalWeight = 0;
    for (let i = 0; i < vectors.length; i += 1) {
        const currentWeight = weights[i] || 0;
        if (!currentWeight || vectors[i].length !== vectorLength) continue;

        totalWeight += currentWeight;
        for (let j = 0; j < vectorLength; j += 1) {
            weightedSums[j] += vectors[i][j] * currentWeight;
        }
    }

    if (totalWeight === 0) return [];
    return weightedSums.map((value) => value / totalWeight);
}

// Build a single profile vector from weighted user interests.
async function buildUserProfileVector(userId) {
    const userInterestRows = await UserInterest.find({user_id: userId}).lean();
    if (!userInterestRows.length) return [];

    const interestCategoryIds = userInterestRows.map((interest) => interest.category_id);
    const categories = await Category.find({_id: {$in: interestCategoryIds}}).select("name").lean();
    const categoryNameById = new Map(categories.map((category) => [String(category._id), category.name]));

    const interestVectors = [];
    const interestWeights = [];

    for (const interest of userInterestRows) {
        const categoryName = categoryNameById.get(String(interest.category_id));
        if (!categoryName) continue;

        const interestText = `Interesse in ${categoryName}`;
        const interestVector = await embedText(interestText);
        if (!interestVector.length) continue;

        interestVectors.push(interestVector);
        interestWeights.push(normalizeWeight(interest.weight));
    }

    return weightedAverage(interestVectors, interestWeights);
}

function buildContentText(item, categories = []) {
    const categoryText = categories.length ? `Categorieen: ${categories.join(", ")}` : "";
    return `${item.title || ""}. ${item.body || ""}. ${categoryText}`.trim();
}

// Newer content gets a small temporary boost.
function getFreshnessBoost(createdAt) {
    if (!createdAt) return 0;
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays < 3) return 0.08;
    if (ageDays < 7) return 0.05;
    if (ageDays < 14) return 0.03;
    return 0;
}

// Business rules that can nudge an item up independent of semantic similarity.
function getRuleBoost(item, hasPreferredCategory) {
    let boost = 0;
    if (item.is_mandatory) boost += 0.12;
    if (item.is_urgent) boost += 0.08;
    if (hasPreferredCategory) boost += 0.06;
    boost += getFreshnessBoost(item.created_at);

    return boost;
}

// Include traceable values so API consumers can inspect why an item ranked.
function toRecommendationReason(similarity, ruleBoost, preferredCategories = []) {
    return {
        semantic_similarity: Number(similarity.toFixed(6)),
        rule_boost: Number(ruleBoost.toFixed(6)),
        preferred_categories: preferredCategories
    };
}

// Score and rank content for a user using semantic similarity + rule boosts.
export async function generateRecommendations({clientId, userId, limit = 10, persist = true, debug = false}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

    if (!clientId) {
        return {status: 400, payload: {message: "Client id is required"}};
    }

    const userRecord = await User.findOne({_id: userId, client_id: clientId}).lean();

    // User must exist before recommendations can be generated.
    if (!userRecord) {
        return {status: 404, payload: {message: "User not found for this client"}};
    }

    const totalContentCount = await ContentItem.countDocuments({client_id: clientId});
    const eligibleContentItems = await ContentItem.find({client_id: clientId, status: {$ne: "ARCHIVED"}})
        .select("-status -__v")
        .lean();


    // Return early when there is no content available for recommendation.
    if (!eligibleContentItems.length) {
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
                filter: {client_id: String(clientId), status_not_equal: "ARCHIVED"}
            };
        }

        return {status: 200, payload};
    }

    const eligibleContentIds = eligibleContentItems.map((item) => item._id);
    const contentCategoryRelations = await ContentCategory.find({content_id: {$in: eligibleContentIds}}).lean();
    const distinctCategoryIds = [...new Set(contentCategoryRelations.map((relation) => String(relation.category_id)))];
    const categories = await Category.find({_id: {$in: distinctCategoryIds}, client_id: clientId}).select("name").lean();

    const categoryNameById = new Map(categories.map((category) => [String(category._id), category.name]));
    const categoryIdsByContentId = new Map();

    for (const relation of contentCategoryRelations) {
        const contentId = String(relation.content_id);
        const relatedCategoryIds = categoryIdsByContentId.get(contentId) || [];
        relatedCategoryIds.push(String(relation.category_id));
        categoryIdsByContentId.set(contentId, relatedCategoryIds);
    }

    // Determine which categories this user explicitly prefers.
    const userInterestRows = await UserInterest.find({user_id: userId}).lean();
    const preferredCategoryIdSet = new Set(userInterestRows.map((interest) => String(interest.category_id)));

    // Personalization opt-out: return newest eligible content.
    if (userRecord.personalization_enabled === false) {
        const nonPersonalizedItems = eligibleContentItems
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, safeLimit)
            .map((item, index) => ({
                rank_position: index + 1,
                score: 0,
                content: item,
                reason: {mode: "personalization_disabled"}
            }));

        const payload = {
            status: 200,
            payload: {
                user_id: userId,
                personalization_enabled: false,
                total: nonPersonalizedItems.length,
                items: nonPersonalizedItems,
                message: "Personalization is disabled for this user, returning newest content"
            }
        };

        //if debug show more context for chosen content
        if (debug) {
            payload.payload.debug = {
                total_content_count: totalContentCount,
                eligible_content_count: eligibleContentItems.length,
                user_interests_count: userInterestRows.length
            };
        }

        return payload;
    }

    const userVector = await buildUserProfileVector(userId);

    const scoredContentItems = [];
    for (const contentItem of eligibleContentItems) {
        const categoryIdsForItem = categoryIdsByContentId.get(String(contentItem._id)) || [];
        const categoryNamesForItem = categoryIdsForItem
            .map((id) => categoryNameById.get(String(id)))
            .filter(Boolean);

        const contentText = buildContentText(contentItem, categoryNamesForItem);
        const contentVector = await embedText(contentText);

        const similarity = userVector.length ? cosineSimilarity(userVector, contentVector) : 0;
        const hasPreferredCategory = categoryIdsForItem.some((id) => preferredCategoryIdSet.has(String(id)));
        const ruleBoost = getRuleBoost(contentItem, hasPreferredCategory);

        const finalScore = clamp01((similarity + 1) / 2 + ruleBoost);

        const preferredCategoryNamesForItem = categoryIdsForItem
            .filter((id) => preferredCategoryIdSet.has(String(id)))
            .map((id) => categoryNameById.get(String(id)))
            .filter(Boolean);

        scoredContentItems.push({
            content: contentItem,
            score: finalScore,
            reason: toRecommendationReason(similarity, ruleBoost, preferredCategoryNamesForItem)
        });
    }

    // Highest score first, then trim to requested limit.
    scoredContentItems.sort((a, b) => b.score - a.score);
    const topRankedItems = scoredContentItems.slice(0, safeLimit);

    let recommendationRun = null;
    if (persist) {
        recommendationRun = await RecommendationRun.create({client_id: clientId, user_id: userId});

        if (topRankedItems.length) {
            await RecommendationItem.insertMany(
                topRankedItems.map((entry, index) => ({
                    client_id: clientId,
                    run_id: recommendationRun._id,
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
            run_id: recommendationRun?._id || null,
            personalization_enabled: true,
            total: topRankedItems.length,
            items: topRankedItems.map((entry, index) => ({
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
            eligible_content_count: eligibleContentItems.length,
            user_interests_count: userInterestRows.length,
            preferred_category_count: preferredCategoryIdSet.size
        };
    }

    return payload;
}
