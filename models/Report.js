import mongoose from "mongoose";
import "dotenv/config";

const reportSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        title: {type: String, required: true},
        description: {type: mongoose.Schema.Types.Mixed, required: true},

        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        content_id: {type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", required: true},
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                ret._links = {
                    self: {href: `${process.env.BASE_URI_REPORTS}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_REPORTS}`},
                };
                delete ret._id;
            },
        },
    }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;