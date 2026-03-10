import express from 'express';
import mongoose from 'mongoose';
import ContentItem from '../models/ContentItem.js';
import ContentCategory from '../models/ContentCategory.js';
import Category from '../models/Category.js';
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
        const category = await Category.findOne({ legacyId: numericLegacyId }).select("_id").lean();
        if (category?._id) {
            return String(category._id);
        }
    }

    const byName = await Category.findOne({ name: asString }).select("_id").lean();
    if (byName?._id) {
        return String(byName._id);
    }

    return null;
}

//headers en options
contentItemRouter.use((req, res, next) => {
    console.log("Check accept header");

    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
        return next();
    }

    if (!req.headers.accept ||
        req.headers.accept.includes("application/json") ||
        req.headers.accept.includes("*/*") ||
        req.headers.accept.includes("text/html")) {
        return next();
    }

    return res.status(406).json({
        message: "Alleen application/json wordt ondersteund! Ben je de accept header vergeten?",
    });
});

contentItemRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

//get (alles ophalen)
contentItemRouter.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const totalItems = await ContentItem.countDocuments();
        const limit = req.query.limit ? parseInt(req.query.limit) : totalItems;
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const contentItems = await ContentItem.find({}).skip(skip).limit(limit);

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

        res.json(collection);
    } catch (e) {
        console.log("Error bij ophalen van content items:", e);
        res.status(500).json({
            error: 'fetch content items gefaald',
        });
    }
});

//post

//POST
contentItemRouter.post('/', async (req, res) => {
    console.log("Post ontvangen")
    try {
        const resolvedCategoryId = await resolveCategoryObjectId(req.body.category_id);
        if (!resolvedCategoryId) {
            return res.status(400).json({
                message: "Request van de client is ongeldig",
                error: "category_id moet een geldige Category ObjectId zijn, of een bestaand numeriek legacyId, of een bestaande categorienaam"
            });
        }

        const contentItem = new ContentItem({
            legacyId: req.body.legacyId,
            title: req.body.title,
            body: req.body.body,
            category_id: resolvedCategoryId,
            is_urgent: req.body.is_urgent,
            is_mandatory: req.body.is_mandatory,
            starts_at: req.body.starts_at,
            ends_at: req.body.ends_at,
            status: req.body.status,
            created_by: req.body.created_by,
            image: req.body.image
        })
        await contentItem.save();
        if (resolvedCategoryId) {
            await syncContentCategories(contentItem._id, [resolvedCategoryId]);
        }
        res.json(contentItem);
    } catch (e) {
        console.error("Create content item error:", e);
        res.status(400).json({
            message: "Request van de client is ongeldig",
            error: e.message
        });
    }
});

//get met id
contentItemRouter.get("/:id", async (req, res) => {
    console.log("Details opgehaald")
    try {
        const contentItemId = req.params.id;
        const contentItem = await ContentItem.findById(contentItemId);
        res.json(contentItem);
    } catch (e) {
        console.error("Error bij ophalen content item id:", e);
        res.status(404).json({
            message: "Resource van content item bestaat niet op de server",
        });
    }
});

//put
contentItemRouter.put("/:id", async (req, res) => {
    const contentItemId = req.params.id;

    const resolvedCategoryId = req.body.category_id === undefined
        ? undefined
        : await resolveCategoryObjectId(req.body.category_id);

    if (req.body.category_id !== undefined && !resolvedCategoryId) {
        return res.status(400).json({
            message: "Request van de client is ongeldig",
            error: "category_id moet een geldige Category ObjectId zijn, of een bestaand numeriek legacyId, of een bestaande categorienaam"
        });
    }

    const newContentItem = {
        legacyId: req.body.legacyId,
        title: req.body.title,
        body: req.body.body,
        category_id: resolvedCategoryId,
        is_urgent: req.body.is_urgent,
        is_mandatory: req.body.is_mandatory,
        starts_at: req.body.starts_at,
        ends_at: req.body.ends_at,
        status: req.body.status,
        created_by: req.body.created_by,
        image: req.body.image
    };

    try {
        const updatedContentItem = await ContentItem.findByIdAndUpdate(
            contentItemId, newContentItem,
            {new: true}
        );

        if (resolvedCategoryId) {
            await syncContentCategories(updatedContentItem._id, [resolvedCategoryId]);
        }
        res.json({
            message: "Content item aangepast!",
            contentItem: updatedContentItem
        });

    } catch (e) {
        console.error("Update fout:", e);
        res.status(500).json({
            message: "Er ging iets mis",
            error: e.message
        });
    }

});

//delete
contentItemRouter.delete("/:id", async (req, res) => {
    console.log("Delete ontvangen", req.params.id);
    try {
        const deletedContentItem = await ContentItem.findByIdAndDelete(req.params.id);

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
        res.status(500).json({
            message: "Fout bij verwijderen",
            error: e.message
        });
    }
});

export default contentItemRouter;