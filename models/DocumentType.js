import mongoose from "mongoose";
import "dotenv/config";

const documentTypeSchema = new mongoose.Schema(
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
                    self: {href: `${process.env.BASE_URI_DOCUMENT_TYPES}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_DOCUMENT_TYPES}`},
                };
                delete ret._id;
            },
        },
        toObject: {virtuals: true}
    }
);

documentTypeSchema.virtual("documents", {
    ref: "Document",
    localField: "_id",
    foreignField: "type_id"
});

const DocumentType = mongoose.model("DocumentType", documentTypeSchema);
export default DocumentType;