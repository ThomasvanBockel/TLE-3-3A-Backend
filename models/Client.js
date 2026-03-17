import mongoose from "mongoose";
import "dotenv/config";

const clientSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, unique: true},
        is_active: {type: Boolean, required: true, default: true},
        client_user_id: {type: mongoose.Schema.Types.ObjectId, ref: "ClientUser", required: true}
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
            }
        }
    }
);

const Client = mongoose.model("Client", clientSchema);
export default Client;