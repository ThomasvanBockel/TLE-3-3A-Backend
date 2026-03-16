import express from "express";
import UserInterest from "../../models/UserInterest.js";
import Category from "../../models/Category.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {auth} from "../middlewares/auth.js";

const userInterestRouter = express.Router();

// GET alle interesses van ingelogde user
userInterestRouter.get("/", publicApiKey, auth, async (req, res) => {
    try {
        const interests = await UserInterest.find({
            user_id: req.userId
        }).populate("category_id");

        return res.status(200).json(interests);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// POST 1 interesse toevoegen of updaten
userInterestRouter.post("/", publicApiKey, auth, async (req, res) => {
    try {
        const {category_id, weight} = req.body;

        if (!category_id) {
            return res.status(400).json({
                message: "category_id is required"
            });
        }

        const category = await Category.findOne({
            _id: category_id,
            client_id: req.clientId
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const interest = await UserInterest.findOneAndUpdate(
            {
                user_id: req.userId,
                category_id
            },
            {
                user_id: req.userId,
                category_id,
                weight: typeof weight === "boolean" ? weight : true
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).populate("category_id");

        return res.status(201).json(interest);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// POST bulk interesses opslaan
userInterestRouter.post("/bulk", publicApiKey, auth, async (req, res) => {
    try {
        const {category_ids} = req.body;

        if (!Array.isArray(category_ids)) {
            return res.status(400).json({
                message: "category_ids must be an array"
            });
        }

        const categories = await Category.find({
            _id: {$in: category_ids},
            client_id: req.clientId
        });

        if (categories.length !== category_ids.length) {
            return res.status(400).json({
                message: "One or more categories are invalid"
            });
        }

        await UserInterest.deleteMany({user_id: req.userId});

        const docs = category_ids.map((category_id) => ({
            user_id: req.userId,
            category_id,
            weight: true
        }));

        const inserted = await UserInterest.insertMany(docs);

        return res.status(201).json({
            message: "User interests updated",
            items: inserted
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// PUT 1 user interest aanpassen
userInterestRouter.put("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const {weight} = req.body;

        if (typeof weight !== "boolean") {
            return res.status(400).json({
                message: "weight must be a boolean"
            });
        }

        const updated = await UserInterest.findOneAndUpdate(
            {
                _id: req.params.id,
                user_id: req.userId
            },
            {weight},
            {
                new: true,
                runValidators: true
            }
        ).populate("category_id");

        if (!updated) {
            return res.status(404).json({
                message: "User interest not found"
            });
        }

        return res.status(200).json(updated);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE 1 interesse verwijderen
userInterestRouter.delete("/:id", publicApiKey, auth, async (req, res) => {
    try {
        const deleted = await UserInterest.findOneAndDelete({
            _id: req.params.id,
            user_id: req.userId
        });

        if (!deleted) {
            return res.status(404).json({
                message: "User interest not found"
            });
        }

        return res.status(200).json({
            message: "User interest deleted successfully"
        });
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default userInterestRouter;