import express from "express";
import mongoose from "mongoose";
// import router from "./routes/routeRouter.js"


const app = express();
app.use(express.json())
try {
    await mongoose.connect(process.env.MONGODB_URL)
    app.use(express.urlencoded())
   // app.use("/plants", router)
} catch (e) {
    app.use((req, res) => {
        res.status(500).send("Database doesnt respond")
        console.log(`error`)
    })
}

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`server is listed on port ${process.env.EXPRESS_PORT}`)
})