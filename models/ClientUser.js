import mongoose from "mongoose";
import "dotenv/config";

const clientUserSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        password_hash: {type: String, required: true},
        is_admin: {type: Boolean, required: true},

    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.password_hash;
            },
        },
    }
);

const ClientUser = mongoose.model("ClientUser", clientUserSchema);
export default ClientUser;