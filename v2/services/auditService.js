import AuditLog from "../../models/AuditLog.js";
import {logError} from "../utils/logger.js";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
    "password",
    "password_hash",
    "token",
    "authorization",
    "apiKey",
    "api_key",
    "api_key_hash",
    "x-api-key",
    "bsn"
]);

function sanitizeValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (value && typeof value === "object") {
        const out = {};

        for (const [key, nested] of Object.entries(value)) {
            if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
                out[key] = REDACTED;
                continue;
            }

            out[key] = sanitizeValue(nested);
        }

        return out;
    }

    return value;
}

export async function writeAuditLog({
    req,
    eventType,
    status = "SUCCESS",
    actorUserId,
    targetType,
    targetId,
    clientId,
    beforeState,
    afterState,
    details
}) {
    try {
        await AuditLog.create({
            client_id: clientId || req?.clientId || null,
            actor_user_id: actorUserId || req?.userId || null,
            target_type: targetType,
            target_id: targetId ? String(targetId) : undefined,
            event_type: eventType,
            status,
            request_id: req?.requestId,
            path: req?.originalUrl,
            method: req?.method,
            ip: req?.ip,
            user_agent: req?.header?.("user-agent"),
            type_request: eventType,
            before_state: sanitizeValue(beforeState),
            after_state: sanitizeValue(afterState),
            details: sanitizeValue(details)
        });
    } catch (error) {
        logError("audit_log_write_failed", {
            request_id: req?.requestId,
            event_type: eventType,
            reason: error?.message || "unknown"
        });
    }
}
