import express from "express";
import ClientUser from "../models/ClientUser.js";
import Client from "../models/Client.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {clientAuth} from "../middlewares/clientAuth.js";
import {clientAdminOnly} from "../middlewares/clientAdminOnly.js";
import {clientLoginLimiter} from "../middlewares/clientLoginLimiter.js";

const clientUserRouter = express.Router();

clientUserRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
    res.status(204).send();
});

clientUserRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
    res.status(204).send();
});

// Alleen admin mag alle client users zien
clientUserRouter.get("/", clientAuth, clientAdminOnly, async (req, res) => {
    try {
        const client = await Client.findById(req.clientId);
        if (!client) {
            return res.status(404).json({message: "Client not found"});
        }

        const clientUsers = await ClientUser.find({
            _id: client.client_user_id
        });

        const items = clientUsers.map((clientUser) => ({
            id: clientUser.id,
            name: clientUser.name,
            is_admin: clientUser.is_admin
        }));

        return res.status(200).json({items});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Eigen profiel ophalen
clientUserRouter.get("/:id", clientAuth, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const isOwn = req.clientUserId === id;
        const isAdmin = req.clientRole === "ADMIN";

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const clientUser = await ClientUser.findById(id);

        if (!clientUser) {
            return res.status(404).json({message: "client user not found"});
        }

        return res.status(200).json({clientUser});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Register: maakt client + eerste admin clientUser
clientUserRouter.post("/register", async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const password = req.body.password;
        const client_name = req.body.client_name?.trim();

        if (!name || !password || !client_name) {
            return res.status(400).json({message: "name, password en client_name zijn verplicht"});
        }

        if (password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"});
        }

        const existingClientUser = await ClientUser.findOne({name});
        if (existingClientUser) {
            return res.status(400).json({message: "Client user bestaat al"});
        }

        const existingClient = await Client.findOne({name: client_name});
        if (existingClient) {
            return res.status(400).json({message: "Client bestaat al"});
        }

        const passwordHashed = await bcrypt.hash(password, 12);

        const clientUser = new ClientUser({
            name,
            password_hash: passwordHashed,
            is_admin: true
        });

        await clientUser.save();

        const client = new Client({
            name: client_name,
            is_active: true,
            client_user_id: clientUser._id
        });

        await client.save();

        return res.status(201).json({
            message: "Client account created",
            clientUser,
            client
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Login
clientUserRouter.post("/login", clientLoginLimiter, async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const password = req.body.password;

        if (!name || !password) {
            return res.status(400).json({message: "empty field"});
        }

        const clientUser = await ClientUser.findOne({name});
        if (!clientUser) {
            return res.status(401).json({message: "login information is not correct"});
        }

        const isMatch = await bcrypt.compare(password, clientUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({message: "login information is not correct"});
        }

        const payload = {
            sub: clientUser.id,
            role: clientUser.is_admin ? "ADMIN" : "CLIENT_USER"
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        return res.status(200).json({
            message: "login succes",
            token,
            clientUser
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Admin kan andere clientUser aanpassen
clientUserRouter.put("/admin/edit/:id", clientAuth, clientAdminOnly, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const {name, is_admin} = req.body;
        const update = {};

        if (name !== undefined) update.name = name.trim();
        if (typeof is_admin === "boolean") update.is_admin = is_admin;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (update.name) {
            const exists = await ClientUser.findOne({name: update.name, _id: {$ne: id}});
            if (exists) {
                return res.status(400).json({message: "Name already exists"});
            }
        }

        const updated = await ClientUser.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true
        });

        if (!updated) {
            return res.status(404).json({message: "de client user is niet gevonden"});
        }

        return res.status(200).json(updated);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Eigen naam aanpassen
clientUserRouter.put("/edit/:id", clientAuth, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        if (req.clientUserId !== id) {
            return res.status(403).json({message: "you can only edit your own information"});
        }

        const name = req.body.name?.trim();

        if (!name) {
            return res.status(400).json({message: "these fields cannot be empty"});
        }

        const clientUser = await ClientUser.findById(id);
        if (!clientUser) {
            return res.status(404).json({message: "de client user is niet gevonden"});
        }

        const exists = await ClientUser.findOne({name});
        if (exists && String(exists._id) !== String(clientUser._id)) {
            return res.status(400).json({message: "Name already exists"});
        }

        const updated = await ClientUser.findByIdAndUpdate(
            id,
            {name},
            {new: true, runValidators: true}
        );

        return res.status(200).json(updated);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// Eigen account of admin delete
clientUserRouter.delete("/delete/:id", clientAuth, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const isOwn = req.clientUserId === id;
        const isAdmin = req.clientRole === "ADMIN";

        if (!isOwn && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const deleted = await ClientUser.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({message: "client user is niet gevonden"});
        }

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "gefaald om te verwijderen"});
    }
});

export default clientUserRouter;