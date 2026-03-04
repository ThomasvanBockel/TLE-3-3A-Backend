import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt"


const userRouter = express.Router()
userRouter.get("/", (req, res) => {

    res.json("hello world")
})

userRouter.post("/", async (req, res) => {
    try {
        const password = req.body.password
        const SALT_ROUNDS = 10
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);
        if (!req.body.name || !req.body.email || !req.body.password) {
            res.status(400).json("emty erea's")
        }

        const exists = await User.findOne({email: req.body.email})
        if (exists) return res.status(400).json({message: "Email already exists"})

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password_hash: passwordHashed,
            birth_date: req.body.birth_date,
            phone_number: req.body.phone_number,
            is_admin: req.body.is_admin,
            personalization_enabled: req.body.personalization_enabled

        })
        await user.save()
        res.status(201)
    } catch (e) {
        console.log(e)
    }
})

// POST /api/users/admin  -> maak admin
userRouter.post("/admin", async (req, res) => {
    try {
        const adminExists = await User.exists({is_admin: true});

        if (adminExists) {
            const role = req.header("x-role");
            if (role !== "ADMIN") {
                return res.status(403).json({message: "Forbidden"});
            }
        }

        const {name, email, password, birth_date, phone_number, personalization_enabled} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({message: "empty area's"});
        }

        const exists = await User.findOne({email});
        if (exists) return res.status(400).json({message: "Email already exists"});

        const SALT_ROUNDS = 10;
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

        const adminUser = new User({
            name,
            email,
            password_hash: passwordHashed,
            birth_date,
            phone_number,
            is_admin: true,
            personalization_enabled: personalization_enabled ?? true
        });

        await adminUser.save();
        return res.status(201).json(adminUser);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

export default userRouter