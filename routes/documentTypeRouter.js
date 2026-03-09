import express from "express";
import DocumentType from "../models/DocumentType.js";

const documentTypeRouter = express.Router();

//header
documentTypeRouter.use((req, res, next) => {
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

//options
documentTypeRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

// get all
documentTypeRouter.get("/", async (req, res) => {
    try {
        const documentTypes = await DocumentType.find({});
        return res.status(200).json(documentTypes);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// post
documentTypeRouter.post("/", async (req, res) => {
    try {
        const documentType = new DocumentType({
            name: req.body.name,
            description: req.body.description,
        });
        await documentType.save();
        return res.status(201).json(documentType);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// get met id
documentTypeRouter.get("/:id", async (req, res) => {
    try {
        const documentTypeId = req.params.id;
        const documentType = await DocumnetType.findById(documentTypeId);
        res.json(documentType);
    } catch (e) {
        console.error("Error fetching document type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// put met id
documentTypeRouter.put("/:id", async (req, res) => {
    try {
        const documentTypeId = req.params.id;
        const updatedData = {
            name: req.body.name,
            description: req.body.description,
        };
        const updatedDocumentType = await DocumentType.findByIdAndUpdate(documentTypeId, updatedData, { new: true });
        res.json(updatedDocumentType);
    } catch (e) {
        console.error("Error updating document type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// delete met id
documentTypeRouter.delete("/:id", async (req, res) => {
    try {
        const deletedDocumentType = await DocumentType.findByIdAndDelete(req.params.id);
        if (!deletedDocumentType) {
            return res.status(404).json({ message: "Document type not found" });
        }
        res.json({ message: "Document type deleted successfully" });
    } catch (e) {
        console.error("Error deleting document type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});
export default documentTypeRouter;