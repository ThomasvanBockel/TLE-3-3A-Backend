import express from "express";
import Client from "../models/Client.js";
import contentItemRouter from "./contentItemRouter.js";

const clientRouter = express.Router();

// GET all clients
//header

clientRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS")

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})
// options for /:id
clientRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE")

    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})


//options


// get all
clientRouter.get("/", async (req, res) => {
    try {
        const clients = await Client.find({});
        return res.status(200).json(clients);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// post
clientRouter.post("/", async (req, res) => {
    try {
        if (!req.body.name || !req.body.is_active) {
            return res.status(400).json({message: "Name is required"});
        }

        const client = new Client({
            name: req.body.name,
            is_active: req.body.is_active ?? true,
        });

        await client.save();
        return res.status(201).json(client);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
        const clients = await Client.find().sort({name: 1});
        res.json(clients);
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

// put met id
clientRouter.put("/:id", async (req, res) => {
    try {
        const clientId = req.params.id;
        const updatedData = {
            name: req.body.name,
            is_active: req.body.is_active ?? true
        };
        const updatedClient = await Client.findByIdAndUpdate(clientId, updatedData, {new: true});
        res.json(updatedClient);
    } catch (e) {
        console.error("Error updating client by ID:", e);
        res.status(500).json({message: "Server error"});
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