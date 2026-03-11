import express from "express";
import DocumentType from "../models/DocumentType.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middleware/auth.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

const documentTypeRouter = express.Router();

// OPTIONS open laten
documentTypeRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

documentTypeRouter.options("/seed", (req, res) => {
    res.header("Allow", "POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(204).send();
});

documentTypeRouter.options("/:id", (req, res) => {
    res.header("Allow", "GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    res.status(204).send();
});

// GET ALL - publiek per client
documentTypeRouter.get("/", publicLimiter, publicApiKey, async (req, res) => {
    try {
        const documentTypes = await DocumentType.find({
            client_id: req.clientId
        }).sort({name: 1});

        return res.status(200).json(documentTypes);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// CREATE - alleen admin
documentTypeRouter.post("/", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, description} = req.body;

        if (!name) {
            return res.status(400).json({message: "name is required"});
        }

        const exists = await DocumentType.findOne({
            name,
            client_id: req.clientId
        });

        if (exists) {
            return res.status(400).json({message: "Document type already exists"});
        }

        const documentType = new DocumentType({
            client_id: req.clientId,
            name,
            description
        });

        await documentType.save();
        return res.status(201).json(documentType);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// SEED - alleen admin binnen eigen client
documentTypeRouter.post("/seed", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const seedData = [
            {
                client_id: req.clientId,
                name: "Paspoort",
                description: "Officieel reisdocument dat de identiteit en nationaliteit van de houder bevestigt."
            },
            {
                client_id: req.clientId,
                name: "Rijbewijs",
                description: "Officieel document dat toestemming geeft om een motorvoertuig te besturen."
            },
            {
                client_id: req.clientId,
                name: "ID Kaart",
                description: "Officieel identiteitsbewijs dat de identiteit van de houder bevestigt."
            },
            {
                client_id: req.clientId,
                name: "Certificaten",
                description: "Officiële documenten die aantonen dat iemand een bepaalde opleiding of training heeft voltooid."
            },
            {
                client_id: req.clientId,
                name: "Medische Verklaring",
                description: "Officieel document dat de medische toestand van een persoon bevestigt, vaak vereist voor reizen of werk."
            },
            {
                client_id: req.clientId,
                name: "Verzekeringspolis",
                description: "Officieel document dat de voorwaarden en dekking van een verzekering beschrijft."
            }
        ];

        const existing = await DocumentType.find({
            client_id: req.clientId,
            name: {$in: seedData.map((d) => d.name)}
        }).select("name");

        const existingNames = new Set(existing.map((d) => d.name));
        const toInsert = seedData.filter((d) => !existingNames.has(d.name));

        if (toInsert.length === 0) {
            return res.status(200).json({
                message: "No document types to seed",
                inserted: 0
            });
        }

        const inserted = await DocumentType.insertMany(toInsert, {ordered: false});

        return res.status(201).json({
            message: "Database seeded successfully",
            inserted: inserted.length,
            data: inserted
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE - publiek per client
documentTypeRouter.get("/:id", publicApiKey, async (req, res) => {
    try {
        const documentType = await DocumentType.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!documentType) {
            return res.status(404).json({message: "Document type not found"});
        }

        return res.status(200).json(documentType);
    } catch (e) {
        console.error("Error fetching document type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// UPDATE - alleen admin
documentTypeRouter.put("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, description} = req.body;
        const updatedData = {};

        if (name !== undefined) updatedData.name = name;
        if (description !== undefined) updatedData.description = description;

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (updatedData.name) {
            const exists = await DocumentType.findOne({
                name: updatedData.name,
                client_id: req.clientId,
                _id: {$ne: req.params.id}
            });

            if (exists) {
                return res.status(400).json({message: "Document type already exists"});
            }
        }

        const updatedDocumentType = await DocumentType.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            updatedData,
            {new: true, runValidators: true}
        );

        if (!updatedDocumentType) {
            return res.status(404).json({message: "Document type not found"});
        }

        return res.status(200).json(updatedDocumentType);
    } catch (e) {
        console.error("Error updating document type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - alleen admin
documentTypeRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deletedDocumentType = await DocumentType.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deletedDocumentType) {
            return res.status(404).json({message: "Document type not found"});
        }

        return res.status(200).json({message: "Document type deleted successfully"});
    } catch (e) {
        console.error("Error deleting document type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default documentTypeRouter;