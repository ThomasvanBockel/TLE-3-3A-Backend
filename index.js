import express from "express";
import v1Router from "./v1/index.js"

const app = express();
console.log("Index.js wordt uitgevoerd");
app.use("/v1", v1Router);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`server is listed on port ${process.env.EXPRESS_PORT}`)
})