import express from "express";
import Client from "../models/Client.js";

const clientRouter = express.Router();

//header
clientRouter.use((req, res, next) => {
    console.log("Check accept header");

    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
        return next();
    }

    if (!req.headers.accept ||
        req.headers.accept.includes("application/json") ||
        req.headers.accept.includes("*/*") ||
        req.headers.accept.includes("text/html")) {
        return next();
    }

    return res.status(406).json({
        message: "Alleen application/json wordt ondersteund! Ben je de accept header vergeten?",
    });
});

//options
clientRouter.options("/", (req, res) => {
    res.header("Allow", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send();
});

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
            return res.status(400).json({ message: "Name is required" });
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
    }
});

// get met id
clientRouter.get("/:id", async (req, res) => {
    try {
        const clientId = req.params.id;
        const client = await Client.findById(clientId);
        res.json(client);
    } catch (e) {
        console.error("Error fetching client by ID:", e);
        res.status(500).json({ message: "Server error" });
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
        const updatedClient = await Client.findByIdAndUpdate(clientId, updatedData, { new: true });
        res.json(updatedClient);
    } catch (e) {
        console.error("Error updating client by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});

//seed
clientRouter.post("/seed", async (req, res) => {
    try {
        await Client.deleteMany({});
        const seedData = [
            { name: "Client 3A", is_active: true },
            { name: "Client 3B", is_active: true },
        ];
        await Client.insertMany(seedData);
        return res.status(201).json({ message: "Database seeded successfully" });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Server error" });
    }
});

// delete met id
clientRouter.delete("/:id", async (req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);
        if (!deletedClient) {
            return res.status(404).json({ message: "Client not found" });
        }
        res.json({ message: "Client deleted successfully" });
    } catch (e) {
        console.error("Error deleting client by ID:", e);
        res.status(500).json({ message: "Server error" });
    }
});
export default clientRouter;