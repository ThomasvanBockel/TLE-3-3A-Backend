import crypto from "crypto";

export function requestContext(req, res, next) {
    const incomingRequestId = req.header("x-request-id");
    const requestId = incomingRequestId || crypto.randomUUID();

    req.requestId = requestId;
    req.requestStartedAt = Date.now();
    res.setHeader("x-request-id", requestId);

    next();
}
