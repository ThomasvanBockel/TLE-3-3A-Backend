import mongoose from "mongoose";
import "dotenv/config";

const auditLogSchema = new mongoose.Schema(
    {
        legacyId: {type: Number, required: false, unique: true, sparse: true},

        client_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: false,
            index: true
        },
        actor_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },
        target_type: {type: String, required: false},
        target_id: {type: String, required: false},

        event_type: {type: String, required: true, index: true},
        status: {
            type: String,
            required: true,
            enum: ["SUCCESS", "FAILURE"],
            default: "SUCCESS"
        },
        request_id: {type: String, required: false, index: true},
        path: {type: String, required: false},
        method: {type: String, required: false},
        ip: {type: String, required: false},
        user_agent: {type: String, required: false},

        // Keep the legacy field for compatibility with older consumers.
        type_request: {type: String, required: false},
        before_state: {type: mongoose.Schema.Types.Mixed, required: false},
        after_state: {type: mongoose.Schema.Types.Mixed, required: false},
        details: {type: mongoose.Schema.Types.Mixed, required: false},
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

auditLogSchema.index({client_id: 1, event_type: 1, created_at: -1});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;