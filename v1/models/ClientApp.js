import mongoose from "mongoose";

const clientAppSchema = new mongoose.Schema(
    {
        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },
        name: {type: String, required: true},
        api_key_hash: {type: String, required: true, unique: true},
        is_active: {type: Boolean, required: true, default: true},
        last_used_at: {type: Date, required: false}
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: false},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.api_key_hash;
            }
        }
    }
);

const ClientApp = mongoose.model("ClientApp", clientAppSchema);
export default ClientApp;