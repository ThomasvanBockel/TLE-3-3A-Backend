import mongoose from "mongoose";
import "dotenv/config";

const userSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        first_name: {type: String, required: true},
        last_name: {type: String, required: true},
        gender: {type: String, required: false},

        email: {type: String, required: true},
        password_hash: {type: String, required: true},

        birth_date: {type: Date, required: false},
        phone_number: {type: String, required: false},

        is_admin: {type: Boolean, required: true, default: false},
        personalization_enabled: {type: Boolean, required: true, default: true},
        bsn: {type: String, required: true}
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.password_hash;
            },
        },
    }
);

// email alleen uniek binnen dezelfde client
userSchema.index({client_id: 1, email: 1}, {unique: true});

const User = mongoose.model("User", userSchema);
export default User;