import express from "express";
import Category from "../../models/Category.js";
import Category from "../models/Category.js";
import {adminOnly} from "../middleware/adminOnly.js";
import {auth} from "../middleware/auth.js";
import {publicApiKey} from "../middlewares/publicApi.js";
import {publicLimiter} from "../middlewares/rateLimit.js";

const categoryRouter = express.Router();
categoryRouter.options("/", (req, res) => {
    res.header("Allow", "POST, GET, OPTIONS")
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})

// GET ALL - teamgebonden publiek
    categoryRouter.get("/", publicLimiter, publicApiKey, async (req, res) => {
        try {
            const categories = await Category.find({
                client_id: req.clientId
            }).sort({name: 1});

            return res.status(200).json(categories);
        } catch (e) {
            console.log(e);
            return res.status(500).json({message: "Server error"});
        }
    });
// options for /:id
categoryRouter.options("/:id", (req, res) => {
    res.header("Allow", "PUT, GET, OPTIONS, DELETE")

    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.status(204).send()
})
// helper (zelfde stijl als bij admin endpoint)
const requireAdmin = (req, res) => {
    const role = req.header("x-role");
    if (role !== "ADMIN") {
        res.status(403).json({message: "Forbidden"});
        return false;
    }
    return true;
};

// GET ALL - iedereen
categoryRouter.get("/", async (req, res) => {
    try {
        const categories = await Category.find({
            client_id: req.clientId
        }).sort({name: 1});

        return res.status(200).json(categories);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// SEED - alleen admin, binnen eigen client
categoryRouter.post("/seed", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const seedCategories = [
            {name: "Afval & Recycling", client_id: req.clientId},
            {name: "Vergunningen", client_id: req.clientId},
            {name: "Zorg & Ondersteuning", client_id: req.clientId},
            {name: "Belastingen", client_id: req.clientId},
            {name: "Paspoort & ID", client_id: req.clientId},
            {name: "Verhuizen", client_id: req.clientId},
            {name: "Melding openbare ruimte", client_id: req.clientId},
            {name: "Parkeren", client_id: req.clientId},
            {name: "Bouwen & Wonen", client_id: req.clientId},
            {name: "Werk & Inkomen", client_id: req.clientId}
        ];

        const existing = await Category.find({
            name: {$in: seedCategories.map((c) => c.name)}
        }).select("name");

        const existingNames = new Set(existing.map((c) => c.name));
        const toInsert = seedCategories.filter((c) => !existingNames.has(c.name));

        if (toInsert.length === 0) {
            return res.status(200).json({
                message: "No categories to seed",
                inserted: 0
            });
        }

        const inserted = await Category.insertMany(toInsert, {ordered: false});

        return res.status(201).json({
            message: "Seeded categories",
            inserted: inserted.length,
            data: inserted
        });
    } catch (e) {
        console.log(e);
        if (e?.code === 11000) {
            return res.status(201).json({
                message: "Seeded categories (some already existed)"
            });
        }
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE - teamgebonden publiek
categoryRouter.get("/:id", publicApiKey, async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!category) {
            return res.status(404).json({message: "Category not found"});
        }

        return res.status(200).json(category);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// CREATE - alleen admin, binnen eigen client
categoryRouter.post("/", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, legacyId} = req.body;

        if (!name) {
            return res.status(400).json({message: "name is required"});
        }

        const exists = await Category.findOne({
            name,
            client_id: req.clientId
        });

        if (exists) {
            return res.status(400).json({message: "Category already exists"});
        }

        const category = new Category({
            name,
            legacyId,
            client_id: req.clientId
        });

        await category.save();

        return res.status(201).json(category);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// UPDATE - alleen admin, binnen eigen client
categoryRouter.put("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const {name, legacyId} = req.body;
        const update = {};

        if (name !== undefined) update.name = name;
        if (legacyId !== undefined) update.legacyId = legacyId;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (update.name) {
            const exists = await Category.findOne({
                name: update.name,
                client_id: req.clientId,
                _id: {$ne: req.params.id}
            });

            if (exists) {
                return res.status(400).json({message: "Category name already exists"});
            }
        }

        const category = await Category.findOneAndUpdate(
            {
                _id: req.params.id,
                client_id: req.clientId
            },
            update,
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({message: "Category not found"});
        }

        return res.status(200).json(category);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - alleen admin, binnen eigen client
categoryRouter.delete("/:id", publicApiKey, auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Category.findOneAndDelete({
            _id: req.params.id,
            client_id: req.clientId
        });

        if (!deleted) {
            return res.status(404).json({message: "Category not found"});
        }

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default categoryRouter;