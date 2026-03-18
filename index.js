import express from "express";
import mongoose from "mongoose";
import router from "./routes/routeRouter.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// static frontend bestanden
app.use(express.static("public"));

// simpele CORS
app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, x-api-key");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// Accept check alleen voor API-routes
app.use("/api", (req, res, next) => {
    const acceptHeader = req.headers["accept"] || "";

    console.log(`Client accepteert: ${acceptHeader}`);

    if (
        !acceptHeader ||
        acceptHeader.includes("application/json") ||
        acceptHeader.includes("*/*") ||
        acceptHeader.includes("text/html")
    ) {
        return next();
    }

    return res.status(400).send("Illegal format");
});

// root route
app.get("/", (req, res) => {
    res.sendFile(new URL("./public/index.html", import.meta.url).pathname);
});

try {
    await mongoose.connect(process.env.MONGODB_URL);
    app.use("/", router);
} catch (e) {
    console.log(e);
    app.use((req, res) => {
        res.status(500).send("Database doesnt respond");
    });
}

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`server is listed on port ${process.env.EXPRESS_PORT}`);
});