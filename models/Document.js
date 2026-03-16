import mongoose from "mongoose";
import "dotenv/config";

const documentSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        type_id: {type: mongoose.Schema.Types.ObjectId, ref: "DocumentType", required: true},

        end_date: {type: Date, required: true},
        start_date: {type: Date, required: true},

        extended: {type: Boolean, required: true}
    },
    {
        timestamps: true,
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

const Document = mongoose.model("Document", documentSchema);
export default Document;