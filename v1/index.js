import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js"
import dotenv from "dotenv";
import inquiryTypeRouter from "./routes/inquiryTypeRouter.js";

dotenv.config();

const v1Router = express.Router();
v1Router.use(express.json())

v1Router.use((req, res, next) => {
    const acceptHeader = req.headers["accept"];
    const method = req.method

    res.set("Access-Control-Allow-Origin", "*")

    console.log(`Client accepteert: ${acceptHeader}`);
    if (method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
        return next();
    }
    if (!acceptHeader ||
        acceptHeader.includes("application/json")
    ) {
        console.log(`this is JSON`)
        return next();
    } else {
        return res.status(400).send("Illegal format");
    }
});


try {
    await mongoose.connect(process.env.MONGODB_URL)
    v1Router.use(express.urlencoded())
    v1Router.use("/", router)
} catch (e) {
    v1Router.use((req, res) => {
        res.status(500).send("Database doesnt respond")
        console.log(`error`)
    })
}

export default v1Router;
