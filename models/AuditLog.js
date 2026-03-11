import mongoose from "mongoose";
import "dotenv/config";

const auditLogSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: false},
        content_id: {type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", required: true},

        type_request: {type: String, required: true},
        before_state: {type: mongoose.Schema.Types.Mixed, required: false},
        after_state: {type: mongoose.Schema.Types.Mixed, required: false},
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: false},
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret.id = ret._id;
                ret._links = {
                    self: {href: `${process.env.BASE_URI_AUDIT_LOG}${ret._id}`},
                    collection: {href: `${process.env.BASE_URI_AUDIT_LOG}`},
                };
                delete ret._id;
            },
        },
    }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;