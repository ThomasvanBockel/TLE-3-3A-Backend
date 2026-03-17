import express from "express";
import ClientUser from "../models/ClientUser.js";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import {adminOnly} from "../middleware/adminOnly.js";
import {auth} from "../middleware/auth.js";

const clientUserRouter = express.Router()

clientUserRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS")

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})
clientUserRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE")

    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})


//edit voor admin
clientUserRouter.put("/admin/edit/:id", auth, adminOnly, async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const {
            name,
            is_admin,
        } = req.body;

        const clientUser = await ClientUser.findById(id)

        if (!name) {
            return res.status(400).json({message: " these fields cannot be empty"})
        }
        const updated = await ClientUser.findByIdAndUpdate(
            id,
            {
                ...(name && {name}),
                ...(is_admin && {is_admin}),
            },
            {new: true, runValidators: true}
        );
        if (!updated) {
            return res.status(404).json({message: "de client user is niet gevonden"})
        }

        res.status(200).json(updated)
    } catch (e) {
        console.log(e)
    }
})

// get all
clientUserRouter.get("/", async (req, res) => {
    try {

        const clientUser = await ClientUser.find()

        const items = clientUser.map((clientUser) => ({
            id: clientUser.id,
            name: clientUser.name,
        }));
        res.json({items})
    } catch (e) {
        console.log(e)
    }
})

// get met id
clientUserRouter.get("/:id", auth, async (req, res) => {
    try {

        const id = req.params.id

        const clientUser = await ClientUser.findById(id)

        if (req.auth.sub !== id) {
            return res.status(401).json({message: "you can only get your own information"})
        }
        if (!clientUser) {
            return res.status(404).json("client user not found")
        }
        res.json({clientUser})
    } catch (e) {
        console.log(e)
    }
})
// register for the client user
clientUserRouter.post("/register", async (req, res) => {
    try {
        if (!req.body.name || !req.body.password ) {
            return res.status(400).json("empty fields")
        }
        // hashing password
        const password = req.body.password
        const SALT_ROUNDS = 10
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

        const clientUser = new ClientUser({
            name: req.body.name,
            password_hash: passwordHashed,
            is_admin: req.body.is_admin ?? false,
        })
        await clientUser.save()
        res.status(201).json("account created")
    } catch (e) {
        console.log(e)
    }
})
// login voor de client user
clientUserRouter.post("/login", async (req, res) => {
    try {
        if (!req.body.password || !req.body.name) {
            return res.status(400).json("empty field")
        }

        const clientUser = await ClientUser.findOne({name: req.body.name})
        if (!clientUser) {
            return res.status(404).json("login information is not correct")
        }
        // checking if password matches
        const password = req.body.password
        const is_match = await bcrypt.compare(password, clientUser.password_hash);
        if (!is_match) {
            return res.status(401).json("login information is not correct")
        }
// JWT if it's a user login as a user if it's an admin login as an admin
        if (clientUser.is_admin === 1) {
            const role = req.header("x-role");
            const payload = {sub: clientUser.id, role: 'admin'};
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, clientUser, role})
        } else {
            const payload = {sub: clientUser.id, role: 'clientUser'};
            const role = req.header("x-role");
            const secret = process.env.JWT_SECRET;
            const token = await jwt.sign(payload, secret, {
                expiresIn: '1h'
            });
            return res.status(200).json({message: "login succes", token, clientUser, role})
        }
    } catch (e) {
        console.log(e)
    }
})


// POST  -> maak admin
clientUserRouter.post("/admin", async (req, res) => {
    try {
        const adminExists = await ClientUser.exists({is_admin: true});

        if (adminExists) {
            const role = req.header("x-role");
            if (role !== "ADMIN") {
                return res.status(403).json({message: "Forbidden"});
            }
        }

        const {
            name,
            password,
        } = req.body;

        if (!password) {
            return res.status(400).json({message: "empty area"});
        }

        const SALT_ROUNDS = 10;
        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

        const adminClientUser = new ClientUser({
            name,
            password_hash: passwordHashed,
            is_admin: true,
        });

        await adminClientUser.save();
        return res.status(201).json(adminClientUser);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});




// edit voor gewone client user
clientUserRouter.put("/edit/:id", auth, async (req, res) => {
    try {
        const id = req.params.id

        if (req.auth.sub !== id) {
            return res.status(401).json({message: "you can only edit your own information"})
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({message: "these fields cannot be empty"})
        }

        const clientUser = await ClientUser.findById(id)

        const exists = await ClientUser.findOne({name: name})

        if (exists && clientUser.name !== exists.name) {
            return res.status(400).json({message: "Name already exists"})
        }

        const updated = await ClientUser.findByIdAndUpdate(
            id,
            {
                ...(name && {name}),
            },
            {new: true, runValidators: true}
        );
        if (!updated) {
            return res.status(404).json({message: "de client user is niet gevonden"})
        }

        res.status(200).json(updated)
    } catch (e) {
        console.log(e)
        return res.status(500).json({message: "Server error"})
    }
})

// delete
clientUserRouter.delete("/delete/:id", auth, async (req, res) => {
    try {
        const id = req.params.id

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }
        const deleted = await ClientUser.findByIdAndDelete(id)

        if (!deleted) {
            return res.status(404).json({message: "client user is niet gevonden"})
        }
        res.status(204).send()
    } catch (e) {
        res.status(500).json({message: "gefaald om te verwijderen"})
    }
})
export default clientUserRouter;