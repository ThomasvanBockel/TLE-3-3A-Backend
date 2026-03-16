import express from "express";
import ClientApp from "../models/ClientApp.js";
import {generateApiKey, hashApiKey} from "../utils/apiKey.js";

const apiRouter = express.Router();

apiRouter.get("/client-apps", async (req, res) => {
    try {
        const clientApps = await ClientApp.find();
        res.status(200).json(clientApps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

apiRouter.post("/client-apps", async (req, res) => {
    try {
        const {client_id, name} = req.body;

        const rawKey = generateApiKey();
        const api_key_hash = hashApiKey(rawKey);

        const clientApp = await ClientApp.create({
            client_id,
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
apiRouter.delete("/client-apps/:id", async (req, res) => {
    try {
        await ClientApp.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Verwijderd" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

apiRouter.patch("/client-apps/:id", async (req, res) => {
    try {
        if (!req.params.id || req.params.id === "undefined") {
            return res.status(400).json({ message: "Geen geldige ID meegegeven" });
        }

        const clientApp = await ClientApp.findById(req.params.id);
        if (!clientApp) return res.status(404).json({ message: "App niet gevonden" });

        clientApp.is_active = !clientApp.is_active;
        await clientApp.save();
        res.status(200).json({ is_active: clientApp.is_active });
    } catch (error) {
        console.error("Patch error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default apiRouter;