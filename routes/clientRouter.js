import express from "express";
import Client from "../models/Client.js";

const clientRouter = express.Router();

// GET all clients
clientRouter.get("/", async (req, res) => {
    try {
        const clients = await Client.find().sort({name: 1});
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// GET one client
clientRouter.get("/:id", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({message: "Client not found"});
        }

        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// POST create client
clientRouter.post("/", async (req, res) => {
    try {
        const {name, is_active} = req.body;

        const existingClient = await Client.findOne({name});
        if (existingClient) {
            return res.status(400).json({message: "Client already exists"});
        }

        const client = await Client.create({
            name,
            is_active: is_active ?? true
        });

        res.status(201).json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// PUT update client
clientRouter.put("/:id", async (req, res) => {
    try {
        const {name, is_active} = req.body;

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            {name, is_active},
            {new: true, runValidators: true}
        );

        if (!client) {
            return res.status(404).json({message: "Client not found"});
        }

        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// DELETE client
clientRouter.delete("/:id", async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            return res.status(404).json({message: "Client not found"});
        }

        res.json({message: "Client deleted"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

export default clientRouter;