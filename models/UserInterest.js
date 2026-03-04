import mongoose from "mongoose";
import "dotenv/config";

const userInterestSchema = new mongoose.Schema(
    {
        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        category_id: {type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true},
        weight: {type: Number, required: false, default: 1},
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_USER_INTERESTS}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_USER_INTERESTS}`},
                };
                delete ret._id;
            },
        },
    }
);

userInterestSchema.index({user_id: 1, category_id: 1}, {unique: true});

const UserInterest = mongoose.model("UserInterest", userInterestSchema);
export default UserInterest;