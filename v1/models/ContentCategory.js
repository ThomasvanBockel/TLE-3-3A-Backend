import mongoose from "mongoose";
import "dotenv/config";

const contentCategorySchema = new mongoose.Schema(
    {
        content_id: {type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", required: true},
        category_id: {type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true},
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_CONTENT_CATEGORIES}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_CONTENT_CATEGORIES}`},
                };
                delete ret._id;
            },
        },
    }
);

contentCategorySchema.index({content_id: 1, category_id: 1}, {unique: true});

const ContentCategory = mongoose.model("ContentCategory", contentCategorySchema);
export default ContentCategory;