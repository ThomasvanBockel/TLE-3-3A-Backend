import jwt from "jsonwebtoken";
import ClientUser from "../../models/ClientUser.js";
import Client from "../../models/Client.js";

export async function clientAuth(req, res, next) {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message: "Missing or invalid Authorization header"});
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const clientUser = await ClientUser.findById(decoded.sub);
        if (!clientUser) {
            return res.status(401).json({message: "Client user not found"});
        }

        const client = await Client.findOne({client_user_id: clientUser._id});
        if (!client) {
            return res.status(404).json({message: "Client not found"});
        }

        req.clientAuth = decoded;
        req.clientUser = clientUser;
        req.clientUserId = String(clientUser._id);
        req.clientId = String(client._id);
        req.clientRole = clientUser.is_admin ? "ADMIN" : "CLIENT_USER";

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({message: "Invalid or expired token"});
    }
}