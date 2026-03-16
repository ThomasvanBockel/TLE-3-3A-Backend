import express from "express";
import InquiryType from "../../models/InquiryType.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middlewares/auth.js";
import {adminOnly} from "../middlewares/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

const inquiryTypeRouter = express.Router();

//header
inquiryTypeRouter.use((req, res, next) => {
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
inquiryTypeRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});
// GET ALL - publiek per client
inquiryTypeRouter.get("/", publicLimiter, publicApiKey, async (req, res) => {
    try {
        const inquiryTypes = await InquiryType.find({
            client_id: req.clientId
        }).sort({name: 1});

        return res.status(200).json(inquiryTypes);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// CREATE - alleen admin
inquiryTypeRouter.post("/", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, description} = req.body;

        if (!name) {
            return res.status(400).json({message: "name is required"});
        }

        const exists = await InquiryType.findOne({
            name,
            client_id: req.clientId
        });

        if (exists) {
            return res.status(400).json({message: "Inquiry type already exists"});
        }

        const inquiryType = new InquiryType({
            client_id: req.clientId,
            name,
            description
        });
        await inquiryType.save();
        return res.status(201).json(inquiryType);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE - publiek per client
inquiryTypeRouter.get("/:id", publicApiKey, async (req, res) => {
    try {
        const inquiryType = await InquiryType.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!inquiryType) {
            return res.status(404).json({message: "Inquiry type not found"});
        }

        return res.status(200).json(inquiryType);
    } catch (e) {
        console.error("Error fetching inquiry type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// UPDATE - alleen admin
inquiryTypeRouter.put("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, description} = req.body;
        const updatedData = {};

        if (name !== undefined) updatedData.name = name;
        if (description !== undefined) updatedData.description = description;

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (updatedData.name) {
            const exists = await InquiryType.findOne({
                name: updatedData.name,
                client_id: req.clientId,
                _id: {$ne: req.params.id}
            });

            if (exists) {
                return res.status(400).json({message: "Inquiry type already exists"});
            }
        }

        const updatedInquiryType = await InquiryType.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            updatedData,
            {new: true, runValidators: true}
        );

        if (!updatedInquiryType) {
            return res.status(404).json({message: "Inquiry type not found"});
        }

        return res.status(200).json(updatedInquiryType);
    } catch (e) {
        console.error("Error updating inquiry type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - alleen admin
inquiryTypeRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deletedInquiryType = await InquiryType.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deletedInquiryType) {
            return res.status(404).json({message: "Inquiry type not found"});
        }

        return res.status(200).json({message: "Inquiry type deleted successfully"});
    } catch (e) {
        console.error("Error deleting inquiry type by ID:", e);
        return res.status(400).json({message: "Invalid id"});
    }
});
export default inquiryTypeRouter;