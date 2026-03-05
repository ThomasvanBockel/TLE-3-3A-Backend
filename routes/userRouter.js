import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt"
import contentItemRouter from "./contentItemRouter.js";
import user from "../models/User.js";


const userRouter = express.Router()
userRouter.use((req, res, next) => {
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

userRouter.get("/", async (req, res) => {
    try {
        const user = await User.find({email: req.body.email})
        if (!user) {
            return res.status(404).json("user not found")
        }
        res.json(user)
    } catch (e) {
        console.log(e)
    }
    res.json("hello world")
})

userRouter.post("/register", async (req, res) => {
    try {
        if (!req.body.first_name || !req.body.email || !req.body.password || !req.body.last_name) {
            return res.status(400).json("emty erea's")
        }
        // hashing password
        const password = req.body.password
        const SALT_ROUNDS = 10
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

        // if email exist give an error
        const exists = await User.findOne({email: req.body.email})
        if (exists) {
            return res.status(400).json({message: "Email already exists"})
        }

        const user = new User({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            gender: req.body.gender,
            email: req.body.email,
            password_hash: passwordHashed,
            birth_date: req.body.birth_date,
            phone_number: req.body.phone_number,
            is_admin: req.body.is_admin,
            personalization_enabled: req.body.personalization_enabled

        })
        await user.save()
        res.status(201).json("account created")
    } catch (e) {
        console.log(e)
    }
})

userRouter.post("/login", async (req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            return res.status(400).json("empty erea's")
        }
        // finding the user with email
        const user = await User.findOne({email: req.body.email})
        if (!user) {
            return res.status(404).json("user not found")
        }
        // checking if password matches
        const password = req.body.password
        const is_match = await bcrypt.compare(password, user.password_hash);
        if (!is_match) {
            return res.status(401).json("password is not correct")
        }

        res.status(200).json(user)
    } catch (e) {
        console.log(e)
    }
})
export default userRouter