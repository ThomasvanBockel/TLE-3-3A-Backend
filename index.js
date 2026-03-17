import express from "express";
import v1Router from "./v1/index.js";
import v2Router from "./v2/index.js";
import {corsMiddleware} from "./cors.js";

const app = express();

console.log("Index.js wordt uitgevoerd");

app.use(corsMiddleware);
app.use(express.json());

app.use("/v1", v1Router);
app.use("/v2", v2Router);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`server is listening on port ${process.env.EXPRESS_PORT}`);
});