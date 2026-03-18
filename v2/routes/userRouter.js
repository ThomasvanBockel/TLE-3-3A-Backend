import express from "express";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {adminOnly} from "../middlewares/adminOnly.js";
import {auth} from "../middlewares/auth.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {loginLimiter} from "../middlewares/rateLimit.js";
import {writeAuditLog} from "../services/auditService.js";

const userRouter = express.Router();

// GET /api/user -> alleen admin, alleen eigen client
userRouter.get("/", auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find({client_id: req.clientId});

        const items = users.map((user) => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            is_admin: user.is_admin,
            client_id: user.client_id
        }));

        res.status(200).json({items});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// GET /api/user/:id -> eigen profiel of admin van eigen client
userRouter.get("/:id", auth, async (req, res) => {
    try {
        const id = req.params.id;

        if (id !== req.auth.sub) {
            return res.status(429).json({message: "not the user"})
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const user = await User.findOne({
            _id: id,
            client_id: req.clientId
        });

        if (!user) {
            return res.status(404).json({message: "user not found"});
        }

        const isOwnProfile = req.auth.sub === id;
        const isAdmin = req.auth.is_admin === true;

        if (!isOwnProfile && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        res.status(200).json({user});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// POST /api/user/register -> pre-login, via API key
userRouter.post("/register", publicApiKey, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
            password,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({message: "empty fields"});
        }

        const exists = await User.findOne({
            email,
            client_id: req.clientId
        });

        if (exists) {
            return res.status(400).json({message: "Email already exists"});
        }

        const passwordHashed = await bcrypt.hash(password, 10);

        const user = new User({
            client_id: req.clientId,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            adres,
            nationality,
            postal_code,
            password_hash: passwordHashed,
            birth_date,
            phone_number,
            is_admin: false,
            personalization_enabled: personalization_enabled ?? true
        });

        await user.save();

        res.status(201).json({
            message: "account created",
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                adres: user.adres ?? "",
                nationality: user.nationality ?? "",
                postal_code: user.postal_code ?? "",
                birth_date: user.birth_date ?? null,
                phone_number: user.phone_number ?? "",
                client_id: user.client_id
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// POST /api/user/login -> pre-login, via API key
userRouter.post("/login", publicApiKey, loginLimiter, async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            await writeAuditLog({
                req,
                eventType: "AUTH_LOGIN",
                status: "FAILURE",
                clientId: req.clientId,
                details: {reason: "empty_fields", email: email || null}
            });
            return res.status(400).json({message: "empty fields"});
        }

        const user = await User.findOne({
            email,
            client_id: req.clientId
        });

        if (!user) {
            await writeAuditLog({
                req,
                eventType: "AUTH_LOGIN",
                status: "FAILURE",
                clientId: req.clientId,
                details: {reason: "user_not_found", email}
            });
            return res.status(404).json({message: "user not found"});
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await writeAuditLog({
                req,
                eventType: "AUTH_LOGIN",
                status: "FAILURE",
                actorUserId: user._id,
                clientId: req.clientId,
                details: {reason: "invalid_password", email}
            });
            return res.status(401).json({message: "password is not correct"});
        }

        const payload = {
            sub: user.id,
            clientId: String(user.client_id),
            is_admin: user.is_admin,
            role: user.is_admin ? "ADMIN" : "USER"
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        await writeAuditLog({
            req,
            eventType: "AUTH_LOGIN",
            status: "SUCCESS",
            actorUserId: user._id,
            targetType: "User",
            targetId: user._id,
            clientId: req.clientId,
            details: {email: user.email}
        });

        return res.status(200).json({
            message: "login success",
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                is_admin: user.is_admin,
                client_id: user.client_id
            }
        });
    } catch (e) {
        await writeAuditLog({
            req,
            eventType: "AUTH_LOGIN",
            status: "FAILURE",
            clientId: req.clientId,
            details: {reason: e?.message || "unknown"}
        });
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// POST /api/user/admin -> admin aanmaken
// alleen admin van dezelfde client mag dit doen
userRouter.post("/admin", publicApiKey, async (req, res) => {
    try {
        console.log("HIT ADMIN ROUTE");
        const adminExists = await User.exists({
            client_id: req.clientId,
            is_admin: true
        });
        console.log("adminExists:", adminExists);

        if (adminExists) {
            await writeAuditLog({
                req,
                eventType: "ADMIN_BOOTSTRAP_CREATE",
                status: "FAILURE",
                clientId: req.clientId,
                details: {reason: "admin_already_exists"}
            });
            return res.status(403).json({
                message: "An admin already exists for this client. Only an existing admin can create another admin."
            });
        }

        const {
            first_name,
            last_name,
            gender,
            bsn,
            email,
            password,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({message: "empty areas"});
        }

        const exists = await User.findOne({
            email,
            client_id: req.clientId
        });

        if (exists) {
            return res.status(400).json({message: "Email already exists"});
        }

        const passwordHashed = await bcrypt.hash(password, 10);

        const adminUser = new User({
            client_id: req.clientId,
            first_name,
            last_name,
            gender,
            bsn,
            email,
            password_hash: passwordHashed,
            birth_date,
            phone_number,
            is_admin: true,
            personalization_enabled: personalization_enabled ?? true
        });

        await adminUser.save();

        await writeAuditLog({
            req,
            eventType: "ADMIN_BOOTSTRAP_CREATE",
            status: "SUCCESS",
            targetType: "User",
            targetId: adminUser._id,
            clientId: req.clientId,
            afterState: {
                user_id: adminUser._id,
                email: adminUser.email,
                is_admin: true
            }
        });

        return res.status(201).json({
            message: "First admin created",
            user: adminUser
        });
    } catch (e) {
        await writeAuditLog({
            req,
            eventType: "ADMIN_BOOTSTRAP_CREATE",
            status: "FAILURE",
            clientId: req.clientId,
            details: {reason: e?.message || "unknown"}
        });
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// PUT /api/user/edit/:id -> user bewerkt eigen profiel
userRouter.put("/edit/:id", auth, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        if (req.auth.sub !== id) {
            return res.status(403).json({message: "you can only edit your own information"});
        }

        const {
            first_name,
            last_name,
            gender,
            adres,
            nationality,
            postal_code,
            bsn,
            email,
            birth_date,
            phone_number,
            personalization_enabled
        } = req.body;

        const user = await User.findOne({
            _id: id,
            client_id: req.clientId
        });

        if (!user) {
            return res.status(404).json({message: "user not found"});
        }

        if (email) {
            const exists = await User.findOne({
                email,
                client_id: req.clientId
            });

            if (exists && String(exists._id) !== String(user._id)) {
                return res.status(400).json({message: "Email already exists"});
            }
        }

        const updated = await User.findOneAndUpdate(
            {_id: id, client_id: req.clientId},
            {
                ...(first_name && {first_name}),
                ...(last_name && {last_name}),
                ...(gender && {gender}),
                ...(bsn && {bsn}),
                ...(adres && {adres}),
                ...(nationality && {nationality}),
                ...(postal_code && {postal_code}),
                ...(email && {email}),
                ...(birth_date && {birth_date}),
                ...(phone_number && {phone_number}),
                ...(personalization_enabled !== undefined && {personalization_enabled})
            },
            {new: true, runValidators: true}
        );

        if (!updated) {
            return res.status(404).json({message: "de user is niet gevonden"});
        }

        res.status(200).json(updated);
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// PUT /api/user/admin/edit/:id -> admin bewerkt user binnen eigen client
userRouter.put("/admin/edit/:id", auth, adminOnly, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const {
            first_name,
            last_name,
            gender,
            bsn,
            email,
            birth_date,
            phone_number,
            is_admin,
            personalization_enabled
        } = req.body;

        const user = await User.findOne({
            _id: id,
            client_id: req.clientId
        });

        if (!user) {
            return res.status(404).json({message: "de user is niet gevonden"});
        }

        if (email) {
            const exists = await User.findOne({
                email,
                client_id: req.clientId
            });

            if (exists && String(exists._id) !== String(user._id)) {
                return res.status(400).json({message: "Email already exists"});
            }
        }

        const updated = await User.findOneAndUpdate(
            {_id: id, client_id: req.clientId},
            {
                ...(first_name && {first_name}),
                ...(last_name && {last_name}),
                ...(gender && {gender}),
                ...(bsn && {bsn}),
                ...(email && {email}),
                ...(birth_date && {birth_date}),
                ...(typeof is_admin === "boolean" && {is_admin}),
                ...(phone_number && {phone_number}),
                ...(personalization_enabled !== undefined && {personalization_enabled})
            },
            {new: true, runValidators: true}
        );

        if (!updated) {
            return res.status(404).json({message: "de user is niet gevonden"});
        }

        res.status(200).json(updated);
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Server error"});
    }
});

// DELETE /api/user/delete/:id -> eigen account of admin binnen eigen client
userRouter.delete("/delete/:id", auth, async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "id is niet valid"});
        }

        const isOwnProfile = req.auth.sub === id;
        const isAdmin = req.auth.is_admin === true;

        if (!isOwnProfile && !isAdmin) {
            return res.status(403).json({message: "Forbidden"});
        }

        const deleted = await User.findOneAndDelete({
            _id: id,
            client_id: req.clientId
        });

        if (!deleted) {
            return res.status(404).json({message: "user is niet gevonden"});
        }

        res.status(204).send();
    } catch (e) {
        console.log(e);
        res.status(500).json({message: "gefaald om te verwijderen"});
    }
});

export default userRouter;