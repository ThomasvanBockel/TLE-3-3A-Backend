import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js"
// import router from "./routes/routeRouter.js"
import contentItemRouter from "./routes/contentItemRouter.js"
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json())

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");

    if (req.method === "OPTIONS" && (req.path === "/api/content-items" || req.path === "/api/content-items/")) {
        res.header("Allow", "GET, POST, OPTIONS");
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        return res.sendStatus(204);
    }

    if (req.method === "OPTIONS" && req.path.startsWith("/api/content-items/")) {
        res.header("Allow", "GET, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
        return res.sendStatus(204);
    }

    res.header("Content-Type", "application/json");

    next();
});

try {
    await mongoose.connect(process.env.MONGODB_URL)
    app.use(express.urlencoded())
   // app.use("/plants", router)
    app.use("/api/content-items", contentItemRouter)
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