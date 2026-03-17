import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js"
import dotenv from "dotenv";


dotenv.config();

const v2Router = express.Router();
v2Router.use(express.json())
console.log("v2 router wordt geladen");
v2Router.use((req, res, next) => {
    const acceptHeader = req.headers["accept"];
    const method = req.method

    res.set("Access-Control-Allow-Origin", "*")

    console.log(`Client accepteert: ${acceptHeader}`);
    if (method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, x-api-key");
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
    v2Router.use(express.urlencoded())
    v2Router.use("/", router)
} catch (e) {
    v2Router.use((req, res) => {
        res.status(500).send("Database doesnt respond")
        console.log(`error`)
    })
}

export default v2Router;
