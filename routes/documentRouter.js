import express from "express";
import Document from "../models/Document.js";

const documentRouter = express.Router();

documentRouter.use((req, res, next) => {
    console.log("Check accept header");

    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
        return next();
    }
});