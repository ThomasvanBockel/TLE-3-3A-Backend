import express from "express";
import ContentItem from "../models/ContentItem.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middleware/auth.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";
import ContentItem from '../../models/ContentItem.js';
import ContentCategory from '../../models/ContentCategory.js';
import Category from '../../models/Category.js';
import syncContentCategories from '../async/ContentCategoryAsync.js';

const contentItemRouter = express.Router();

async function resolveCategoryObjectId(rawCategoryId) {
    if (rawCategoryId === undefined || rawCategoryId === null || rawCategoryId === "") {
        return null;
    }

    const asString = String(rawCategoryId).trim();
    if (mongoose.Types.ObjectId.isValid(asString)) {
        return asString;
    }

    const numericLegacyId = Number(asString);
    if (!Number.isNaN(numericLegacyId)) {
        const category = await Category.findOne({legacyId: numericLegacyId}).select("_id").lean();
        if (category?._id) {
            return String(category._id);
        }
    }

    const byName = await Category.findOne({name: asString}).select("_id").lean();
    if (byName?._id) {
        return String(byName._id);
    }

    return null;
}

//headers en options
contentItemRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS")

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})
// options for /:id
contentItemRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE")

    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})

//get (alles ophalen)
contentItemRouter.get('/',publicLimiter, publicApiKey, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;

        const totalItems = await ContentItem.countDocuments({
            client_id: req.clientId
        });

        const limit = req.query.limit ? parseInt(req.query.limit) : totalItems || 10;
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const contentItems = await ContentItem.find({
            client_id: req.clientId
        })
            .skip(skip)
            .limit(limit);

        const collection = {
            items: contentItems,
            _links: {
                self: {
                    href: process.env.BASE_URI_CONTENT_ITEMS
                },
                collection: {
                    href: process.env.BASE_URI_CONTENT_ITEMS
                }
            },
            pagination: {
                currentPage: page,
                currentItems: contentItems.length,
                totalPages: totalPages,
                totalItems: totalItems,
                _links: {
                    first: {href: `${process.env.BASE_URI_CONTENT_ITEMS}?page=1&limit=${limit}`},
                    last: {href: `${process.env.BASE_URI_CONTENT_ITEMS}?page=${totalPages}&limit=${limit}`},
                    previous: page > 1 ? {href: `${process.env.BASE_URI_CONTENT_ITEMS}?page=${page - 1}&limit=${limit}`} : null,
                    next: page < totalPages ? {href: `${process.env.BASE_URI_CONTENT_ITEMS}?page=${page + 1}&limit=${limit}`} : null
                }
            }
        };

        res.status(200).json(collection);
    } catch (e) {
        console.log("Error bij ophalen van content items:", e);
        res.status(500).json({
            message: "fetch content items gefaald"
        });
    }
});

// CREATE - alleen admin
contentItemRouter.post("/", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const resolvedCategoryId = await resolveCategoryObjectId(req.body.category_ids);
        if (!resolvedCategoryId) {
            return res.status(400).json({
                message: "Request van de client is ongeldig",
                error: "category_id moet een geldige Category ObjectId zijn, of een bestaand numeriek legacyId, of een bestaande categorienaam"
            });
        }

        const contentItem = new ContentItem({
            client_id: req.clientId,
            legacyId: req.body.legacyId,
            title: req.body.title,
            body: req.body.body,
            category_ids: resolvedCategoryId,
            is_urgent: req.body.is_urgent,
            is_mandatory: req.body.is_mandatory,
            starts_at: req.body.starts_at,
            ends_at: req.body.ends_at,
            status: req.body.status,
            created_by: req.auth.sub,
            image: req.body.image
        });

        await contentItem.save();
        if (resolvedCategoryId) {
            await syncContentCategories(contentItem._id, [resolvedCategoryId]);
        }
        res.status(201).json(contentItem);
    } catch (e) {
        console.log(e);
        res.status(400).json({
            message: "Request van de client is ongeldig",
            error: e.message
        });
    }
});

// GET ONE - publiek per client
contentItemRouter.get("/:id", publicApiKey, async (req, res) => {
    try {
        const contentItem = await ContentItem.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!contentItem) {
            return res.status(404).json({
                message: "Resource van content item bestaat niet op de server"
            });
        }

        res.status(200).json(contentItem);
    } catch (e) {
        console.error("Error bij ophalen content item id:", e);
        res.status(404).json({
            message: "Resource van content item bestaat niet op de server",
        });
    }
});

// UPDATE - alleen admin
contentItemRouter.put("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const newContentItem = {
            legacyId: req.body.legacyId,
            title: req.body.title,
            body: req.body.body,
            category_ids: req.body.category_ids,
            is_urgent: req.body.is_urgent,
            is_mandatory: req.body.is_mandatory,
            starts_at: req.body.starts_at,
            ends_at: req.body.ends_at,
            status: req.body.status,
            image: req.body.image
        };

        const updatedContentItem = await ContentItem.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            newContentItem,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedContentItem) {
            return res.status(404).json({
                message: "Content item niet gevonden"
            });
        }

        res.status(200).json({
            message: "Content item aangepast!",
            contentItem: updatedContentItem
        });

    } catch (e) {
        console.error("Update fout:", e);
        res.status(400).json({
            message: "Er ging iets mis",
            error: e.message
        });
    }

});

// DELETE - alleen admin
contentItemRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deletedContentItem = await ContentItem.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deletedContentItem) {
            return res.status(404).json({
                message: "Content item niet gevonden"
            });
        }

        await ContentCategory.deleteMany({content_id: req.params.id});

        res.status(200).json({
            message: "Content item verwijderd!",
            deletedContentItem: deletedContentItem
        });

    } catch (e) {
        console.error("Delete error:", e);
        res.status(400).json({
            message: "Fout bij verwijderen",
            error: e.message
        });
    }
});

export default contentItemRouter;