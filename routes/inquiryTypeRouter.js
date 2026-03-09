import express from "express";
import InquiryType  from "../models/InquiryType.js";

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

// get all
inquiryTypeRouter.get("/", async (req, res) => {
    try {
        const inquiryTypes = await InquiryType.find({});
        return res.status(200).json(inquiryTypes);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// post
inquiryTypeRouter.post("/", async (req, res) => {
    try {
        const inquiryType = new InquiryType({
            name: req.body.name,
            description: req.body.description,
        });
        await inquiryType.save();
        return res.status(201).json(inquiryType);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// get met id
inquiryTypeRouter.get("/:id", async (req, res) => {
    try {
        const inquiryTypeId = req.params.id;
        const inquiryType = await InquiryType.findById(inquiryTypeId);
        res.json(inquiryType);
    } catch (e) {
        console.error("Error fetching inquiry type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// put met id
inquiryTypeRouter.put("/:id", async (req, res) => {
    try {
        const inquiryTypeId = req.params.id;
        const updatedData = {
            name: req.body.name,
            description: req.body.description,
        };
        const updatedInquiryType = await InquiryType.findByIdAndUpdate(inquiryTypeId, updatedData, { new: true });
        res.json(updatedInquiryType);
    } catch (e) {
        console.error("Error updating inquiry type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// delete met id
inquiryTypeRouter.delete("/:id", async (req, res) => {
    try {
        const deletedInquiryType = await InquiryType.findByIdAndDelete(req.params.id);
        if (!deletedInquiryType) {
            return res.status(404).json({ message: "Inquiry type not found" });
        }
        res.json({ message: "Inquiry type deleted successfully" });
    } catch (e) {
        console.error("Error deleting inquiry type by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});
export default inquiryTypeRouter;