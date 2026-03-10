import express from "express";
import mongoose from "mongoose";
import { generateRecommendations } from "../services/recommendationService.js";

const recommendationRouter = express.Router();

recommendationRouter.use((req, res, next) => {
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
        message: "Alleen application/json wordt ondersteund! Ben je de accept header vergeten?"
    });
});

recommendationRouter.options("/user/:userId", (req, res) => {
    res.header("Allow", "GET, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).send();
});

recommendationRouter.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const persist = req.query.persist !== "false";
        const debug = req.query.debug === "true";

        const result = await generateRecommendations({ userId, limit, persist, debug });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error while generating recommendations" });
    }
});

export default recommendationRouter;
