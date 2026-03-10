export function adminOnly(req, res, next) {
    if (!req.user?.is_admin) {
        return res.status(403).json({message: "Access denied: admin only"});
    }
    next();
}
