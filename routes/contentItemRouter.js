import express from 'express';
import ContentItem from '../models/ContentItem.js';
import documentRouter from "./documentRouter.js";

const contentItemRouter = express.Router();

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

//POST
contentItemRouter.post('/', async (req, res) => {
    console.log("Post ontvangen")
    try {
        const contentItem = new ContentItem({
            legacyId: req.body.legacyId,
            title: req.body.title,
            body: req.body.body,
            content_type: req.body.content_type,
            is_urgent: req.body.is_urgent,
            is_mandatory: req.body.is_mandatory,
            starts_at: req.body.starts_at,
            ends_at: req.body.ends_at,
            status: req.body.status,
            created_by: req.body.created_by,
            image: req.body.image
        })
        await contentItem.save();
        res.json(contentItem);
    } catch (e) {
        res.status(400).json({
            message: "Request van de client is ongeldig"
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

    const newContentItem = {
        legacyId: req.body.legacyId,
        title: req.body.title,
        body: req.body.body,
        content_type: req.body.content_type,
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