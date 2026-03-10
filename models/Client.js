import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, unique: true},
        is_active: {type: Boolean, required: true, default: true}
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: false},
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