import express from "express";
import Document from "../models/Document.js";


const documentRouter = express.Router();

//headers en options
documentRouter.use((req, res, next) => {
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

documentRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

//get alles
documentRouter.get("/", async (req, res) => {
    try {
        const documents = await Document.find({});

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
        }

        res.json(collection);
    } catch (e) {
        console.error("Error bij ophalen documents:", e);
        res.status(500).json({
            message: "Algemene fout op de server",
        });
    }
});

//post
documentRouter.post("/", async (req, res) => {
    try {
        const document = new Document({
            name: req.body.name,
            description: req.body.description,
        });

        await document.save();
        res.json(document);
    } catch (e) {
        console.error("Error bij aanmaken document:", e);
        res.status(500).json({
            message: "Algemene fout op de server",
        });
    }
});

//get met id
documentRouter.get("/:id", async(req, res) => {
    console.log("Details opgehaald")
    try {
        const documentId = req.params.id;
        const document = await Document.findById(documentId);
        res.json(document);
    } catch (e) {
        console.error("Error bij ophalen document item id:", e);
        res.status(404).json({
            message: "Resource van het document item bestaat niet op de server",
        });
    }
});

//put
documentRouter.put("/:id", async (req, res) => {
    console.log("Update ontvangen")
    try {
        const documentId = req.params.id;
        const updatedDocument = await Document.findByIdAndUpdate(documentId, {
            name: req.body.name,
            description: req.body.description,
        }, { new: true, runValidators: true });

        if (!updatedDocument) {
            return res.status(404).json({ message: "Document niet gevonden" });
        }

        res.json(updatedDocument);
    } catch (e) {
        console.error("Error bij updaten document:", e);
        res.status(400).json({
            message: "Ongeldige data voor update",
            error: e.message
        });
    }
});

//delete
documentRouter.delete("/:id", async (req, res) => {
    console.log("Delete ontvangen")
    try {
        const documentId = req.params.id;
        const deletedDocument = await Document.findByIdAndDelete(documentId);

        if (!deletedDocument) {
            return res.status(404).json({ message: "Document niet gevonden" });
        }

        res.json({ message: "Document verwijderd" });
    } catch (e) {
        console.error("Error bij verwijderen document:", e);
        res.status(400).json({
            message: "Ongeldige id",
            error: e.message
        });
    }
});

export default documentRouter;