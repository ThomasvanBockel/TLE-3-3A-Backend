import express from "express";
import Report from "../models/Report.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middleware/auth.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

const reportRouter = express.Router();

// GET ALL - admin ziet alles van eigen client, user alleen eigen reports
reportRouter.get("/", publicLimiter, publicApiKey, auth, async (req, res) => {
    try {
        const filter = {client_id: req.clientId};

        if (!req.auth.is_admin) {
            filter.user_id = req.auth.sub;
        }

        const reports = await Report.find(filter)
            .populate("user_id")
            .populate("content_id");

        return res.status(200).json(reports);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// CREATE - ingelogde user maakt eigen report binnen eigen client
reportRouter.post("/", publicApiKey, auth, async (req, res) => {
    try {
        const {title, description, content_id} = req.body;

        if (!title || !description || !content_id) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const report = new Report({
            client_id: req.clientId,
            title,
            description,
            user_id: req.auth.sub,
            content_id
        });

        await report.save();

        const populatedReport = await Report.findById(report._id)
            .populate("user_id")
            .populate("content_id");

        return res.status(201).json(populatedReport);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE - eigen report of admin binnen eigen client
reportRouter.get("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            client_id: req.clientId
        })
            .populate("user_id")
            .populate("content_id");

        if (!report) {
            return res.status(404).json({message: "Report not found"});
        }

        const isOwn = String(report.user_id._id || report.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        return res.status(200).json(report);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// UPDATE - eigen report of admin binnen eigen client
reportRouter.put("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const existingReport = await Report.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!existingReport) {
            return res.status(404).json({message: "Report not found"});
        }

        const isOwn = String(existingReport.user_id) === String(req.auth.sub);
        const isAdmin = req.auth.is_admin === true;

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const {title, description, content_id} = req.body;
        const updatedData = {};

        if (title !== undefined) updatedData.title = title;
        if (description !== undefined) updatedData.description = description;
        if (content_id !== undefined) updatedData.content_id = content_id;

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        const updatedReport = await Report.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            updatedData,
            {new: true, runValidators: true}
        )
            .populate("user_id")
            .populate("content_id");

        return res.status(200).json(updatedReport);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - alleen admin binnen eigen client
reportRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deletedReport = await Report.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deletedReport) {
            return res.status(404).json({message: "Report not found"});
        }

        return res.status(200).json({message: "Report deleted successfully"});
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default reportRouter;