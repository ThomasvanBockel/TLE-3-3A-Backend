import mongoose from "mongoose";
import "dotenv/config";

const inquiryTypeSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        name: {type: String, required: true},
        description: {type: String, required: false}
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {href: `${process.env.BASE_URI_INQUIRY_TYPES}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_INQUIRY_TYPES}`},
                };
                delete ret._id;
            },
        },
    }
);

const InquiryType = mongoose.model("InquiryType", inquiryTypeSchema);
export default InquiryType;