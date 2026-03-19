import cors from "cors";

const allowedOrigins = [
    "http://localhost:5173",
    "http://145.24.237.124/",
    "http://145.24.237.144"
];

export const corsMiddleware = cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "x-api-key"]
});