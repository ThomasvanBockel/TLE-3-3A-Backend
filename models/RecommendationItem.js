import mongoose from "mongoose";
import "dotenv/config";

const recommendationItemSchema = new mongoose.Schema(
    {
        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        run_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RecommendationRun",
            required: true
        },

        content_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ContentItem",
            required: true
        },

        rank_position: {
            type: Number,
            required: true,
            min: 1
        },

        score: {
            type: mongoose.Schema.Types.Decimal128,
            required: false
        },

        reason: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        },

        is_overridden: {
            type: Boolean,
            required: false,
            default: false
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;

                if (ret.score != null) {
                    ret.score = ret.score.toString();
                }

                ret._links = {
                    self: {href: `${process.env.BASE_URI_RECOMMENDATION_ITEMS}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_RECOMMENDATION_ITEMS}`},
                };

                delete ret._id;
            },
        },
    }
);

recommendationItemSchema.index(
    {client_id: 1, run_id: 1, content_id: 1},
    {unique: true}
);

const RecommendationItem = mongoose.model("RecommendationItem", recommendationItemSchema);
export default RecommendationItem;