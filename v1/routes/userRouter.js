import express from "express";
import User from "../../models/User.js";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import {adminOnly} from "../middleware/adminOnly.js";
import {auth} from "../middleware/auth.js";

const userRouter = express.Router()

userRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS")

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})
userRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE")

    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})


// /api/user/admin/edit/:id -> admin can edit user data
userRouter.put("/admin/edit/:id", auth, adminOnly, async (req, res) => {
    try {
        // get the user id from the uri
        const id = req.params.id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        // get the user data
        const {
            client_id,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
            birth_date,
            phone_number,
            is_admin,
            personalization_enabled
        } = req.body;

        // get the user by its id
        const user = await User.findById(id)

        // finding a use with that email
        const exists = await User.findOne({email: email})

        // checks if the email is the user's email
        if (exists && user.email !== exists.email) {
            return res.status(400).json({message: "Email already exists"})
        }


        // check if the first name, last name and email is not empty
        if (!first_name && !last_name && !email) {
            return res.status(400).json({message: " these fields cannot be empty"})
        }
        // update the user info
        const updated = await User.findByIdAndUpdate(
            id,
            {
                ...(client_id && {client_id}),
                ...(first_name && {first_name}),
                ...(last_name && {last_name}),
                ...(gender && {gender}),
                ...(bsn && {bsn}),
                ...(email && {email}),
                ...(adres && {adres}),
                ...(nationality && {nationality}),
                ...(postal_code && {postal_code}),
                ...(birth_date && {birth_date}),
                ...(is_admin && {is_admin}),
                ...(phone_number && {phone_number}),
                ...(personalization_enabled !== undefined && {personalization_enabled})
            },
            {new: true, runValidators: true}
        );
        // error if it's not updated
        if (!updated) {
            return res.status(404).json({message: "de user is niet gevonden"})
        }

        res.status(200).json(updated)
    } catch (e) {
        console.log(e)
    }
})
// /api/user/post overload -> all users
userRouter.get("/", async (req, res) => {
    try {

        const users = await User.find()

        // only shows this data
        const items = users.map((user) => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,

        }));
        res.json({items})
    } catch (e) {
        console.log(e)
    }
})

// get data from one user with id
userRouter.get("/:id", auth, async (req, res) => {
    try {
        const id = req.params.id

        // find the user with there id
        const user = await User.findById(id)


        if (req.auth.sub !== id) {
            return res.status(401).json({message: "you can only get your own information"})
        }

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
            return res.status(400).json("empty fields")
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
            client_id: req.body.client_id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            gender: req.body.gender,
            email: req.body.email,
            adres: req.body.adres,
            nationality: req.body.nationality,
            postal_code: req.body.postal_code,
            password_hash: passwordHashed,
            birth_date: req.body.birth_date,
            phone_number: req.body.phone_number,
            is_admin: req.body.is_admin ?? false,
            personalization_enabled: req.body.personalization_enabled,
            bsn: req.body.bsn
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
        if (!req.body.email && !req.body.password) {
            return res.status(400).json("empty fields")
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
            return res.status(401).json("login information is not correct")
        }
// JWT if it's a user login as a user if it's an admin login as an admin
        if (user.is_admin === 1) {
            const role = req.header("x-role");
            const payload = {sub: user.id, role: 'admin'};
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, user, role})
        } else {
            const payload = {sub: user.id, role: 'user'};
            const role = req.header("x-role");
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, user, role})
        }
        // JWT if its a user login as a user if its a admin login as a admin
        if (user.is_admin === 1) {
            const role = req.header("x-role");
            const payload = {sub: user.id, role: 'admin'};
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, user, role})
        } else {
            const payload = {sub: user.id, role: 'user'};
            const role = req.header("x-role");
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, user, role})
        }
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
            client_id,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
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
            client_id,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
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
userRouter.put("/edit/:id", auth, async (req, res) => {
    try {
        // get the user id from the uri
        const id = req.params.id

        if (req.auth.sub !== id) {
            return res.status(401).json({message: "you can only edit your own information"})
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        // get the data out of the body
        const {
            client_id,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        // get the user by its id
        const user = await User.findById(id)

        // finding a user with that email
        const exists = await User.findOne({email: email})

        // checks if the email is the user's email
        if (exists && user.email !== exists.email) {
            return res.status(400).json({message: "Email already exists"})
        }

        // check if the first name, last name and email is not empty
        if (!first_name && !last_name && !email) {
            return res.status(400).json({message: " these fields cannot be empty"})
        }
        // update the user info
        const updated = await User.findByIdAndUpdate(
            id,
            {
                ...(client_id && {client_id}),
                ...(first_name && {first_name}),
                ...(last_name && {last_name}),
                ...(gender && {gender}),
                ...(bsn && {bsn}),
                ...(email && {email}),
                ...(adres && {adres}),
                ...(nationality && {nationality}),
                ...(postal_code && {postal_code}),
                ...(birth_date && {birth_date}),
                ...(phone_number && {phone_number}),
                ...(personalization_enabled !== undefined && {personalization_enabled})
            },
            {new: true, runValidators: true}
        );
        // error if it's not updated
        if (!updated) {
            return res.status(404).json({message: "de user is niet gevonden"})
        }

        res.status(200).json(updated)
    } catch (e) {
        console.log(e)
    }
})
userRouter.delete("/delete/:id", auth, async (req, res) => {
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