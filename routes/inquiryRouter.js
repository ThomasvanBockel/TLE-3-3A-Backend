import express from "express";
import Inquiry from "../models/Inquiry.js";
import crypto from "crypto";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middleware/auth.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

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

// GET ALL - admin binnen eigen client
inquiryRouter.get("/", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {status, type, token} = req.query;

        const filter = {client_id: req.clientId};
        if (status) filter.status = status;
        if (type) filter.type_id = type;
        if (token) filter.token = token;

        const inquiries = await Inquiry.find(filter).sort({created_at: -1});
        return res.status(200).json(inquiries);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE BY TOKEN - eigen client
inquiryRouter.get("/token/:token", publicApiKey, auth, async (req, res) => {
    try {
        const inquiry = await Inquiry.findOne({
            token: req.params.token,
            client_id: req.clientId
        });

        if (!inquiry) {
            return res.status(404).json({message: "Inquiry not found"});
        }

        const isOwn = String(inquiry.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE BY ID - eigen inquiry of admin binnen eigen client
inquiryRouter.get("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const inquiry = await Inquiry.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!inquiry) {
            return res.status(404).json({message: "Inquiry not found"});
        }

        const isOwn = String(inquiry.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// CREATE - ingelogde user maakt inquiry binnen eigen client
inquiryRouter.post("/", publicLimiter, publicApiKey, auth, async (req, res) => {
    try {
        const {type_id, created_at, content, status, question} = req.body;

        if (!type_id || !created_at || !content || !status || !question) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const user_id = req.auth.sub;

        const activeStatuses = ["OPEN", "IN_PROGRESS"];
        const alreadyActiveSameType = await Inquiry.findOne({
            client_id: req.clientId,
            user_id,
            type_id,
            status: {$in: activeStatuses}
        });

        if (alreadyActiveSameType) {
            return res.status(409).json({
                message: "You already have an active inquiry of this type"
            });
        }

        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                const inquiry = new Inquiry({
                    client_id: req.clientId,
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

// UPDATE - eigen inquiry of admin binnen eigen client
inquiryRouter.put("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const {id} = req.params;

        const existingInquiry = await Inquiry.findOne({
            _id: id,
            client_id: req.clientId
        });

        if (!existingInquiry) {
            return res.status(404).json({message: "Inquiry not found"});
        }

        const isOwn = String(existingInquiry.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const allowed = ["type_id", "created_at", "content", "token", "status", "question"];
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
            const exists = await Inquiry.findOne({
                token: update.token,
                client_id: req.clientId,
                _id: {$ne: id}
            });

            if (exists) {
                return res.status(409).json({message: "Token already exists"});
            }
        }

        const inquiry = await Inquiry.findOneAndUpdate(
            {
                _id: id,
                client_id: req.clientId
            },
            update,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// PATCH STATUS - admin binnen eigen client
inquiryRouter.patch("/:id/status", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {status} = req.body;

        if (!status) {
            return res.status(400).json({message: "status is required"});
        }

        const inquiry = await Inquiry.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            {status},
            {new: true, runValidators: true}
        );

        if (!inquiry) {
            return res.status(404).json({message: "Inquiry not found"});
        }

        return res.status(200).json(inquiry);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - admin binnen eigen client
inquiryRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Inquiry.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deleted) {
            return res.status(404).json({message: "Inquiry not found"});
        }

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default inquiryRouter;