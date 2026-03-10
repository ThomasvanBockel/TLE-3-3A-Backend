import mongoose from "mongoose";
import "dotenv/config";

const clientSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        is_active: {type: Boolean, required: true},
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
    }
);

const Client = mongoose.model("Client", clientSchema);
export default Client;