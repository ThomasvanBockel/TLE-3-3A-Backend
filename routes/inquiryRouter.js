import express from "express";
import Inquiry from "../models/Inquiry.js";
import crypto from "crypto";

const inquiryRouter = express.Router();

function makeToken() {
    return crypto.randomBytes(24).toString("hex");
}
//inquiry/
inquiryRouter.use((req, res, next) => {
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

inquiryRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

// GET ALL - /api/inquiries?status=&type=&token=
inquiryRouter.get("/", async (req, res) => {
    try {
        const {status, type, token} = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (token) filter.token = token;

        const inquiries = await Inquiry.find(filter).sort({created_at: -1});
        return res.status(200).json(inquiries);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE BY ID - /api/inquiries/:id
inquiryRouter.get("/:id", async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) return res.status(404).json({message: "Inquiry not found"});

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// GET ONE BY TOKEN - /api/inquiries/token/:token
inquiryRouter.get("/token/:token", async (req, res) => {
    try {
        const inquiry = await Inquiry.findOne({token: req.params.token});
        if (!inquiry) return res.status(404).json({message: "Inquiry not found"});

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// CREATE - POST /api/inquiries

inquiryRouter.post("/", async (req, res) => {
    try {
        const {user_id, type_id, created_at, content, status, question} = req.body;

        if (!user_id || !type_id || !created_at || !content || !status || !question) {
            return res.status(400).json({message: "Missing required fields"});
        }
        const activeStatuses = ["OPEN", "IN_PROGRESS"];
        const alreadyActiveSameType = await Inquiry.findOne({
            user_id,
            type_id,
            status: {$in: activeStatuses}
        });

        if (alreadyActiveSameType) {
            return res.status(409).json({
                message: "You already have an active inquiry of this type"
            });
        }

        // token genereren + retry bij (zeldzame) duplicate
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                const inquiry = new Inquiry({
                    user_id,
                    type_id,
                    created_at: new Date(created_at),
                    content,
                    status,
                    question,
                    token: makeToken()
                });

                await inquiry.save();
                return res.status(201).json(inquiry);
            } catch (e) {
                if (e?.code === 11000 && e?.keyPattern?.token) {
                    if (attempt === 5) {
                        return res.status(500).json({message: "Could not generate unique token"});
                    }
                    continue;
                }
                throw e;
            }
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// UPDATE (PUT) - /api/inquiries/:id
inquiryRouter.put("/:id", async (req, res) => {
    try {
        const {id} = req.params;

        const allowed = ["type_id", "created_at", "content", "token", "status", "question", "user_id"];
        const update = {};

        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                update[key] = key === "created_at" ? new Date(req.body[key]) : req.body[key];
            }
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (update.token) {
            const exists = await Inquiry.findOne({token: update.token, _id: {$ne: id}});
            if (exists) return res.status(409).json({message: "Token already exists"});
        }

        const inquiry = await Inquiry.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true
        });

        if (!inquiry) return res.status(404).json({message: "Inquiry not found"});

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// PATCH STATUS - /api/inquiries/:id/status
inquiryRouter.patch("/:id/status", async (req, res) => {
    try {
        const {status} = req.body;
        if (!status) return res.status(400).json({message: "status is required"});

        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            {status},
            {new: true, runValidators: true}
        );

        if (!inquiry) return res.status(404).json({message: "Inquiry not found"});

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - /api/inquiries/:id
inquiryRouter.delete("/:id", async (req, res) => {
    try {
        const deleted = await Inquiry.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({message: "Inquiry not found"});

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default inquiryRouter;