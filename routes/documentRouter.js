import express from "express";
import Document from "../models/Document.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middleware/auth.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

const documentRouter = express.Router();

// OPTIONS open laten
documentRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

documentRouter.options("/:id", (req, res) => {
    res.header("Allow", "GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    res.status(204).send();
});

// GET ALL - eigen documenten of alles voor admin binnen eigen client
documentRouter.get("/", publicLimiter, publicApiKey, auth, async (req, res) => {
    try {
        const filter = {client_id: req.clientId};

        if (!req.auth.is_admin) {
            filter.user_id = req.auth.sub;
        }

        const documents = await Document.find(filter);

        const collection = {
            items: documents,
            _links: {
                self: {
                    href: process.env.BASE_URI_DOCUMENT_TYPES
                },
                collection: {
                    href: process.env.BASE_URI_DOCUMENT_TYPES
                }
            }
        };

        res.status(200).json(collection);
    } catch (e) {
        console.error("Error bij ophalen documents:", e);
        res.status(500).json({
            message: "Algemene fout op de server",
        });
    }
});

// CREATE - ingelogde user maakt eigen document binnen eigen client
documentRouter.post("/", publicApiKey, auth, async (req, res) => {
    try {
        const document = new Document({
            client_id: req.clientId,
            user_id: req.auth.sub,
            type_id: req.body.type_id,
            end_date: req.body.end_date,
            start_date: req.body.start_date,
            extended: req.body.extended
        });

        await document.save();
        res.status(201).json(document);
    } catch (e) {
        console.error("Error bij aanmaken document:", e);
        res.status(500).json({
            message: "Algemene fout op de server",
        });
    }
});

// GET ONE - eigen document of admin binnen eigen client
documentRouter.get("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!document) {
            return res.status(404).json({
                message: "Resource van het document item bestaat niet op de server",
            });
        }

        const isOwn = String(document.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        res.status(200).json(document);
    } catch (e) {
        console.error("Error bij ophalen document item id:", e);
        res.status(400).json({
            message: "Invalid id",
        });
    }
});

// UPDATE - eigen document of admin binnen eigen client
documentRouter.put("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const existingDocument = await Document.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!existingDocument) {
            return res.status(404).json({message: "Document niet gevonden"});
        }

        const isOwn = String(existingDocument.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const updatedDocument = await Document.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            {
                type_id: req.body.type_id,
                end_date: req.body.end_date,
                start_date: req.body.start_date,
                extended: req.body.extended
            },
            {new: true, runValidators: true}
        );

        res.status(200).json(updatedDocument);
    } catch (e) {
        console.error("Error bij updaten document:", e);
        res.status(400).json({
            message: "Ongeldige data voor update",
            error: e.message
        });
    }
});

// DELETE - alleen admin binnen eigen client
documentRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deletedDocument = await Document.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deletedDocument) {
            return res.status(404).json({message: "Document niet gevonden"});
        }

        res.status(200).json({message: "Document verwijderd"});
    } catch (e) {
        console.error("Error bij verwijderen document:", e);
        res.status(400).json({
            message: "Ongeldige id",
            error: e.message
        });
    }
});

export default documentRouter;