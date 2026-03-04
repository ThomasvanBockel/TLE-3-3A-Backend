import express from "express";
import User from "../models/User.js";


const userRouter = express.Router()
userRouter.get("/", (req, res) => {

    res.json("hello world")
})

userRouter.post("/", (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,

        })
        res.json()
    } catch (e) {
        console.log(e)
    }
})
export default userRouter