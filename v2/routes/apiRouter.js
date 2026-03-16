import express from "express";
import ClientApp from "../../models/ClientApp.js";
import Client from "../../models/Client.js";
import {generateApiKey, hashApiKey} from "../utils/apiKey.js";

const apiRouter = express.Router();

// GET alles
apiRouter.get("/client-apps", async (req, res) => {
    try {
        const clientApps = await ClientApp.find().populate("client_id");

        res.status(200).json({
            items: clientApps
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// POST aanmaken
apiRouter.post("/client-apps", async (req, res) => {
    try {
        const {client_id, name} = req.body;

        if (!client_id || !name) {
            return res.status(400).json({
                message: "client_id and name are required"
            });
        }

        const client = await Client.findById(client_id);
        if (!client) {
            return res.status(404).json({
                message: "Client not found"
            });
        }

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
            clientId: client_id,
            apiKey: rawKey
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
});

// DELETE client app
apiRouter.delete("/client-apps/:id", async (req, res) => {
    try {
        const deletedClientApp = await ClientApp.findByIdAndDelete(req.params.id);

        if (!deletedClientApp) {
            return res.status(404).json({
                message: "Client app not found"
            });
        }

        res.status(200).json({
            message: "Client app deleted successfully",
            deletedClientAppId: req.params.id
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "Invalid client app id"
        });
    }
});

export default apiRouter;