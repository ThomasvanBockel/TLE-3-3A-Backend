import mongoose from "mongoose";
import "dotenv/config";

const contentItemSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true},

        title: {type: String, required: true},
        body: {type: String, required: true},

        content_type: {type: String, required: true},

        is_urgent: {type: Boolean, required: false},
        is_mandatory: {type: Boolean, required: false},

        starts_at: {type: Date, required: false},
        ends_at: {type: Date, required: false},

        status: {type: String, required: false, default: ""},

        created_by: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: false},

        image: {type: Buffer, required: true},
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_CONTENT_ITEMS}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_CONTENT_ITEMS}`},
                };
                delete ret._id;
            },
        },
    }
);

const ContentItem = mongoose.model("ContentItem", contentItemSchema);
export default ContentItem;