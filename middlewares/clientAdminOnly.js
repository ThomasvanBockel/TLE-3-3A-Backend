export function clientAdminOnly(req, res, next) {
    if (req.clientRole !== "ADMIN") {
        return res.status(403).json({message: "Forbidden"});
    }

    next();
}