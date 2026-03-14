import express from "express";
import mongoose from "mongoose";
import { generateRecommendations } from "../services/recommendationService.js";
import ContentItem from "../models/ContentItem.js";

const recommendationRouter = express.Router();

recommendationRouter.use((req, res, next) => {

    //check for correct headers
    if (!req.headers.accept ||
        req.headers.accept.includes("application/json") ||
        req.headers.accept.includes("*/*") ||
        req.headers.accept.includes("text/html")) {
        return next();
    }

    //error message json required
    return res.status(406).json({
        message: "Alleen application/json wordt ondersteund! Ben je de accept header vergeten?"
    });
});

//options route for logged-in user recommendations
recommendationRouter.options("/user/:userId", (req, res) => {
    res.header("Allow", "GET, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).send();
});

//options route for guest recommendations
recommendationRouter.options("/guest", (req, res) => {
    res.header("Allow", "GET, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).send();
});

//get route to show the newest items for users who are not logged in
recommendationRouter.get("/guest", async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 4;
        const safeLimit = Math.max(1, Math.min(limit, 20));

        const recentItems = await ContentItem.find({ status: { $ne: "ARCHIVED" } })
            .select("-status -__v")
            .sort({ created_at: -1 })
            .limit(safeLimit)
            .lean();

        return res.status(200).json({
            personalization_enabled: false,
            mode: "guest_recent",
            total: recentItems.length,
            items: recentItems
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error while getting guest recommendations" });
    }
});

//get route to show the 4 most recommended content items
recommendationRouter.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;


        //checks for user login
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        //amount of content items shared
        const limit = req.query.limit ? Number(req.query.limit) : 4;

        //save the recommendations
        const persist = req.query.persist !== "false";

        //extra details for development
        const debug = req.query.debug === "true";

        //decide the 4 most recommended content items
        const result = await generateRecommendations({ userId, limit, persist, debug });
        return res.status(result.status).json(result.payload);
        //server error
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error while generating recommendations" });
    }
});

export default recommendationRouter;
