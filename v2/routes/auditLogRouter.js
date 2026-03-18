import express from "express";
import mongoose from "mongoose";
import AuditLog from "../../models/AuditLog.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middlewares/auth.js";
import {adminOnly} from "../middlewares/adminOnly.js";

const auditLogRouter = express.Router();

auditLogRouter.use(publicApiKey, auth, adminOnly);

auditLogRouter.get("/", async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
        const skip = (page - 1) * limit;

        const filter = {client_id: req.clientId};

        if (req.query.event_type) {
            filter.event_type = String(req.query.event_type);
        }

        if (req.query.status) {
            filter.status = String(req.query.status).toUpperCase();
        }

        if (req.query.request_id) {
            filter.request_id = String(req.query.request_id);
        }

        if (req.query.actor_user_id && mongoose.Types.ObjectId.isValid(req.query.actor_user_id)) {
            filter.actor_user_id = req.query.actor_user_id;
        }

        if (req.query.from || req.query.to) {
            filter.created_at = {};

            if (req.query.from) {
                const fromDate = new Date(req.query.from);
                if (!Number.isNaN(fromDate.getTime())) {
                    filter.created_at.$gte = fromDate;
                }
            }

            if (req.query.to) {
                const toDate = new Date(req.query.to);
                if (!Number.isNaN(toDate.getTime())) {
                    filter.created_at.$lte = toDate;
                }
            }

            if (Object.keys(filter.created_at).length === 0) {
                delete filter.created_at;
            }
        }

        const total = await AuditLog.countDocuments(filter);
        const items = await AuditLog.find(filter)
            .sort({created_at: -1})
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            items,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.max(1, Math.ceil(total / limit))
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Server error"});
    }
});

auditLogRouter.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "Invalid id"});
        }

        const auditLog = await AuditLog.findOne({_id: id, client_id: req.clientId}).lean();
        if (!auditLog) {
            return res.status(404).json({message: "Audit log not found"});
        }

        return res.status(200).json(auditLog);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Server error"});
    }
});

export default auditLogRouter;
