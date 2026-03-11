import mongoose from "mongoose";
import "dotenv/config";

const inquiryTypeSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        name: {type: String, required: true},
        description: {type: String, required: false}
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                ret._links = {
                    self: {href: `${process.env.BASE_URI_INQUIRY_TYPES}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_INQUIRY_TYPES}`},
                };
                delete ret._id;
            },
        },
        toObject: {virtuals: true}
    }
);

inquiryTypeSchema.virtual("inquiries", {
    ref: "Inquiry",
    localField: "_id",
    foreignField: "type_id"
});

const InquiryType = mongoose.model("InquiryType", inquiryTypeSchema);
export default InquiryType;