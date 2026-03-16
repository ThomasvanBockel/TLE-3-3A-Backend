import mongoose from "mongoose";
import "dotenv/config";

const contentSimplifiedSchema = new mongoose.Schema(
    {
        content_id: {type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", required: true, unique: true},
        title: {type: String, required: true},
        body: {type: String, required: true},
        status: {type: String, required: true},

        updated_at: {type: Date, required: true},
        created_at: {type: Date, required: true},
    },
    {
        timestamps: false,
        collection: "content_simplefied",
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
            },
        },
    }
);

const ContentSimplified = mongoose.model("ContentSimplified", contentSimplifiedSchema);
export default ContentSimplified;