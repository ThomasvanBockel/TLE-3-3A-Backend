import ClientApp from "../models/ClientApp.js";
import {hashApiKey} from "../utils/apiKey.js";

export async function publicApiKey(req, res, next) {
    try {
        const apiKey = req.header("x-api-key");

        if (!apiKey) {
            return res.status(401).json({message: "Missing API key"});
        }

        const apiKeyHash = hashApiKey(apiKey);

        const clientApp = await ClientApp.findOne({
            api_key_hash: apiKeyHash,
            is_active: true
        }).populate("client_id");

        if (!clientApp || !clientApp.client_id || !clientApp.client_id.is_active) {
            return res.status(401).json({message: "Invalid API key"});
        }

        req.clientId = clientApp.client_id._id;
        req.clientAppId = clientApp._id;

        await ClientApp.findByIdAndUpdate(clientApp._id, {
            last_used_at: new Date()
        });

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}