import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js"
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json())

app.use((req, res, next) => {
    const acceptHeader = req.headers["accept"];
    const method = req.method

    res.set("Access-Control-Allow-Origin", "*")

    console.log(`Client accepteert: ${acceptHeader}`);
    if (acceptHeader.includes("application/json") || method === "OPTIONS") {
        console.log(`this is JSON`)
        next();
    } else {
        res.status(400).send("Illegal format");
    }
});

try {
    await mongoose.connect(process.env.MONGODB_URL)
    app.use(express.urlencoded())
    app.use("/", router)
} catch (e) {
    app.use((req, res) => {
        res.status(500).send("Database doesnt respond")
        console.log(`error`)
    })
}

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`server is listed on port ${process.env.EXPRESS_PORT}`)
})