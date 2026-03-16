import mongoose from "mongoose";
import "dotenv/config";

const categorySchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true},

        name: {type: String, required: true, unique: true},
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_CATEGORIES}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_CATEGORIES}`},
                };
                delete ret._id;
            },
        },
    }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;