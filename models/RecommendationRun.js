import mongoose from "mongoose";
import "dotenv/config";

const recommendationRunSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        content_id: {type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", required: false},
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: false},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_RECOMMENDATION_RUNS}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_RECOMMENDATION_RUNS}`},
                };
                delete ret._id;
            },
        },
    }
);

const RecommendationRun = mongoose.model("RecommendationRun", recommendationRunSchema);
export default RecommendationRun;