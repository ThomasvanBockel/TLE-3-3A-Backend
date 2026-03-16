import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({message: "No token provided"})
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({message: "Invalid token format"})
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)


        req.auth = decoded

        next()
    } catch (err) {
        return res.status(401).json({message: "Invalid or expired token"});
    }
}