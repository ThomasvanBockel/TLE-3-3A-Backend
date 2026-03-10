import express from "express";
import Category from "../models/Category.js";

const categoryRouter = express.Router();

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
        const categories = await Category.find().sort({name: 1});
        return res.status(200).json(categories);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// SEED - alleen admin (zet deze boven /:id !)
categoryRouter.post("/seed", async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const seedCategories = [
            {name: "Afval & Recycling"},
            {name: "Vergunningen"},
            {name: "Zorg & Ondersteuning"},
            {name: "Belastingen"},
            {name: "Paspoort & ID"},
            {name: "Verhuizen"},
            {name: "Melding openbare ruimte"},
            {name: "Parkeren"},
            {name: "Bouwen & Wonen"},
            {name: "Werk & Inkomen"}
        ];

        const existing = await Category.find({
            name: {$in: seedCategories.map((c) => c.name)}
        }).select("name");

        const existingNames = new Set(existing.map((c) => c.name));
        const toInsert = seedCategories.filter((c) => !existingNames.has(c.name));

        if (toInsert.length === 0) {
            return res.status(200).json({message: "No categories to seed", inserted: 0});
        }

        const inserted = await Category.insertMany(toInsert, {ordered: false});
        return res.status(201).json({message: "Seeded categories", inserted: inserted.length, data: inserted});
    } catch (e) {
        console.log(e);
        if (e?.code === 11000) {
            return res.status(201).json({message: "Seeded categories (some already existed)"});
        }
        return res.status(500).json({message: "Server error"});
    }
});

// GET ONE - iedereen
categoryRouter.get("/:id", async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({message: "Category not found"});
        return res.status(200).json(category);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// CREATE - alleen admin
categoryRouter.post("/", async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const {name, legacyId, client_id} = req.body;
        if (!name) return res.status(400).json({message: "name is required"});
        if (!client_id) return res.status(400).json({message: "client_id is required"});

        const exists = await Category.findOne({name});
        if (exists) return res.status(400).json({message: "Category already exists"});

        const category = new Category({name, legacyId, client_id});
        await category.save();

        return res.status(201).json(category);
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: "Server error"});
    }
});

// UPDATE - alleen admin
categoryRouter.put("/:id", async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const {name, legacyId, client_id} = req.body;
        const update = {};

        if (name !== undefined) update.name = name;
        if (legacyId !== undefined) update.legacyId = legacyId;
        if (client_id !== undefined) update.client_id = client_id;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({message: "No valid fields to update"});
        }

        if (update.name) {
            const exists = await Category.findOne({name: update.name, _id: {$ne: req.params.id}});
            if (exists) return res.status(400).json({message: "Category name already exists"});
        }

        const category = await Category.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        });

        if (!category) return res.status(404).json({message: "Category not found"});

        return res.status(200).json(category);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

// DELETE - alleen admin
categoryRouter.delete("/:id", async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({message: "Category not found"});

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(400).json({message: "Invalid id"});
    }
});

export default categoryRouter;