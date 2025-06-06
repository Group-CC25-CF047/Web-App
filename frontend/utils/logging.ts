const logLevel = {
    INFO: "INFO",
    DEBUG: "DEBUG",
    WARNING: "WARNING",
    ERROR: "ERROR"
};

const log = (level: string, message: string) => {
    if (process.env.NODE_ENV !== "production") {
        if (level === logLevel.INFO) {
            console.log(`[${level}] ${message}`);
        } else if (level === logLevel.DEBUG) {
            console.debug(`[${level}] ${message}`);
        } else if (level === logLevel.WARNING) {
            console.warn(`[${level}] ${message}`);
        } else if (level === logLevel.ERROR) {
            console.error(`[${level}] ${message}`);
        }
    }
};

export { log, logLevel };
