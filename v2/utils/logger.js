function write(level, message, metadata = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...metadata
    };

    const output = JSON.stringify(entry);
    if (level === "error") {
        console.error(output);
        return;
    }

    console.log(output);
}

export function logInfo(message, metadata = {}) {
    write("info", message, metadata);
}

export function logWarn(message, metadata = {}) {
    write("warn", message, metadata);
}

export function logError(message, metadata = {}) {
    write("error", message, metadata);
}
