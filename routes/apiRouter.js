import express from "express";
import ClientApp from "../models/ClientApp.js";
import {generateApiKey, hashApiKey} from "../utils/apiKey.js";
import {clientAuth} from "../middlewares/clientAuth.js";

const apiRouter = express.Router();

// GET eigen client apps
apiRouter.get("/client-apps", clientAuth, async (req, res) => {
    try {
        const clientApps = await ClientApp.find({
            client_id: req.clientId
        });

        res.status(200).json(clientApps);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// POST nieuwe api key voor eigen client
apiRouter.post("/client-apps", clientAuth, async (req, res) => {
    try {
        const {name} = req.body;

        if (!name) {
            return res.status(400).json({message: "name is required"});
        }

        const rawKey = generateApiKey();
        const api_key_hash = hashApiKey(rawKey);

        const clientApp = await ClientApp.create({
            client_id: req.clientId,
            name,
            api_key_hash,
            is_active: true
        });

        res.status(201).json({
            message: "Client app created",
            clientAppId: clientApp.id,
            apiKey: rawKey
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// DELETE eigen client app
apiRouter.delete("/client-apps/:id", clientAuth, async (req, res) => {
    try {
        const deleted = await ClientApp.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deleted) {
            return res.status(404).json({message: "Client app not found"});
        }

        res.status(200).json({message: "Verwijderd"});
    } catch (error) {
        res.status(500).json({message: "Server error"});
    }
});

// PATCH toggle active/inactive
apiRouter.patch("/client-apps/:id", clientAuth, async (req, res) => {
    try {
        const clientApp = await ClientApp.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!clientApp) {
            return res.status(404).json({message: "App niet gevonden"});
        }

        clientApp.is_active = !clientApp.is_active;
        await clientApp.save();

        res.status(200).json({is_active: clientApp.is_active});
    } catch (error) {
        console.error("Patch error:", error);
        res.status(500).json({message: "Server error"});
    }
});

export default apiRouter;