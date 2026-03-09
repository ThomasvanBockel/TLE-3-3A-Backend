import mongoose from "mongoose";
import "dotenv/config";

const inquirySchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},

        type_id: {type: String, required: true},
        created_at: {type: Date, required: true},

        content: {type: mongoose.Schema.Types.Mixed, required: true},
        token: {type: String, required: true, index: true},
        status: {type: String, required: true},
        question: {type: String, required: true},
    },
    {
        timestamps: false,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.user_id;
            },
        },
    }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);
export default Inquiry;