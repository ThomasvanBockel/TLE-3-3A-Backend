import mongoose from "mongoose";
import "dotenv/config";

const userSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        name: {type: String, required: true},
        email: {type: String, required: true, unique: true, lowercase: true, trim: true},
        password_hash: {type: String, required: true},

        birth_date: {type: Date, required: false},
        phone_number: {type: String, required: false},

        is_admin: {type: Boolean, required: true, default: false},

        personalization_enabled: {type: Boolean, required: true, default: true},
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.id;
                delete ret.password_hash;
            },
        },
    }
);

const User = mongoose.model("User", userSchema);
export default User;