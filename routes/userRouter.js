import express, {json} from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt"
import contentItemRouter from "./contentItemRouter.js";
import user from "../models/User.js";
import mongoose from "mongoose";


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

// get User data
userRouter.get("/", async (req, res) => {
    try {
        // find the user with there Email
        const user = await User.findOne({email: req.body.email})
        if (!user) {
            return res.status(404).json("user not found")
        }
        res.json({user})
    } catch (e) {
        console.log(e)
    }
})
// register for the user
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
            personalization_enabled: req.body.personalization_enabled,
            bsn_number: req.body.bsn_number
        })
        await user.save()
        res.status(201).json("account created")
    } catch (e) {
        console.log(e)
    }
})
// login for the user
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

        const {
            first_name,
            last_name,
            gender,
            bsn_number,
            email,
            password,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({message: "empty area's"});
        }

        const exists = await User.findOne({email});
        if (exists) return res.status(400).json({message: "Email already exists"});

        const SALT_ROUNDS = 10;
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

        const adminUser = new User({
            first_name,
            last_name,
            gender,
            bsn_number,
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
// edit for the user
userRouter.put("/edit/:id", async (req, res) => {
    try {
        // get the user id from the uri
        const id = req.params.id

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        // get the data out of the body
        const {
            first_name,
            last_name,
            gender,
            bsn_number,
            email,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        // check if the first name, last name and email is not empty
        if (!first_name && !last_name && !email) {
            return res.status(400), json({message: " these fields cannot be empty"})
        }
        // update the user info
        const updated = await User.findByIdAndUpdate(
            id,
            {
                ...(first_name && {first_name}),
                ...(last_name && {last_name}),
                ...(gender && {gender}),
                ...(bsn_number && {bsn_number}),
                ...(email && {email}),
                ...(birth_date && {birth_date}),
                ...(phone_number && {phone_number}),
                ...(personalization_enabled !== undefined && {personalization_enabled})
            },
            {new: true, runValidators: true}
        );
        // error if its not updated
        if (!updated) {
            return res.status(404).json({message: "de plant is niet gevonden"})
        }

        res.status(200).json(updated)
    } catch (e) {
        console.log(e)
    }
})
userRouter.delete("/delete/:id", async (req, res) => {
    try {
        // get there id from the uri
        const id = req.params.id

        // check if the ID is a valid mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }
        //delete the user by there id
        const deleted = await User.findByIdAndDelete(id)

        // error if the user is not deleted
        if (!deleted) {
            return res.status(404).json({message: "plant is niet gevonden"})
        }
        res.status(204).send()
    } catch (e) {
        res.status(500).json({message: "gefaald om te verwijderen"})
    }
})
export default userRouter