import express from "express";
import ClientApp from "../models/ClientApp.js";
import {generateApiKey, hashApiKey} from "../utils/apiKey.js";

const apiRouter = express.Router();

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

export default apiRouter;