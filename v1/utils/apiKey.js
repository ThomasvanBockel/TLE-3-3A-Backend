import crypto from "crypto";

export function generateApiKey() {
    return "sk_" + crypto.randomBytes(32).toString("hex");
}

export function hashApiKey(apiKey) {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
}
