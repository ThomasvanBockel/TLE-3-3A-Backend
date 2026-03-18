import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js"
import dotenv from "dotenv";
import {requestContext} from "./middlewares/requestContext.js";
import {logError, logInfo} from "./utils/logger.js";


dotenv.config();

const v2Router = express.Router();
v2Router.use(express.json())
v2Router.use(requestContext);
logInfo("v2_router_loaded");
v2Router.use((req, res, next) => {
    res.on("finish", () => {
        logInfo("request_completed", {
            request_id: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status_code: res.statusCode,
            duration_ms: Date.now() - req.requestStartedAt
        });
    });

    next();
});

v2Router.use((req, res, next) => {
    const acceptHeader = req.headers["accept"];
    const method = req.method

    res.set("Access-Control-Allow-Origin", "*")

    logInfo("accept_header_checked", {
        request_id: req.requestId,
        accept_header: acceptHeader || null
    });
    if (method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, x-api-key");
        return next();
    }
    if (!acceptHeader ||
        acceptHeader.includes("application/json")
    ) {
        return next();
    } else {
        return res.status(400).send("Illegal format");
    }
});


try {
    await mongoose.connect(process.env.MONGODB_URL)
    v2Router.use(express.urlencoded())
    v2Router.use("/", router)
} catch (e) {
    v2Router.use((req, res) => {
        res.status(500).send("Database doesnt respond")
        logError("database_connection_unavailable", {
            request_id: req.requestId,
            reason: e?.message || "unknown"
        });
    })
}

export default v2Router;
