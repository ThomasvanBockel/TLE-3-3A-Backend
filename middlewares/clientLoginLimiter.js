import rateLimit from "express-rate-limit";

export const clientLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {message: "Too many login attempts, try again later"}
});