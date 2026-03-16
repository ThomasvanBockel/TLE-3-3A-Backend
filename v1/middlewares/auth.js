import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export async function auth(req, res, next) {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message: "Missing or invalid Authorization header"});
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.sub);

        if (!user) {
            return res.status(401).json({message: "User not found"});
        }

        req.auth = decoded;
        req.user = user;
        req.userId = user._id;
        req.clientId = user.client_id;
        req.role = user.is_admin ? "ADMIN" : "USER";

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({message: "Invalid or expired token"});
    }
}