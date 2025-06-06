import chalk from "chalk";
import path from "path";
import { Config } from "../config";

type LogArgument = string | number | boolean | object | Error | null | undefined | unknown;
const isProduction = process.env.NODE_ENV === "production";

enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

const currentLogLevel = (): LogLevel => {
    const configLevel = Config.logging.level.toUpperCase();
    switch (configLevel) {
    case "DEBUG":
        return LogLevel.DEBUG;
    case "INFO":
        return LogLevel.INFO;
    case "WARN":
        return LogLevel.WARN;
    case "ERROR":
        return LogLevel.ERROR;
    case "FATAL":
        return LogLevel.FATAL;
    default:
        return isProduction ? LogLevel.INFO : LogLevel.DEBUG;
    }
};

/**
 * Checks if a log level should be displayed based on the current configuration
 * @param {LogLevel} level - The log level to check
 * @returns {boolean} True if the log should be displayed
 */
function shouldLog(level: LogLevel): boolean {
    return level >= currentLogLevel();
}

/**
 * Formats a filename by reversing the order of components and capitalizing each part
 * @param {string} fileName - The filename to format (e.g., "redis.repository.ts")
 * @returns {string} Formatted filename (e.g., "Repository-Redis")
 */
function formatFileName(fileName: string): string {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExtension.split(/[.-]/);
    const reversedParts = parts.reverse().map(part => part.charAt(0).toUpperCase() + part.slice(1));
    return reversedParts.join("-");
}

/**
 * Gets the calling file name from the stack trace
 * @returns {string} The basename of the calling file or empty string if in production
 */
function getCallerFileName(): string {
    if (isProduction) return "";

    const error = new Error();
    const stack = error.stack?.split("\n") || [];
    const callerLine = stack.find(
        line =>
            line.includes(".ts:") &&
            !line.includes("logging.ts:") &&
            !line.includes("node_modules/")
    );

    if (!callerLine) return "";
    const match = callerLine.match(/\(([^:]+):/);
    if (!match) return "";

    const filePath = match[1];
    return path.basename(filePath);
}

/**
 * Extract the first error message from an error object
 * @param {unknown} err - Error object to extract message from
 * @returns {string} The extracted error message or empty string if not available
 */
function extractErrorMessage(err: unknown): string {
    if (!err) return "";

    if (err instanceof Error) {
        return err.message;
    } else if (typeof err === "string") {
        return err;
    } else if (typeof err === "object" && err !== null && "message" in err) {
        return String((err as { message: unknown }).message);
    }

    return "";
}

/**
 * Logs information messages
 * @param {string} message - The message to log
 * @param {LogArgument[]} args - Additional arguments to log
 */
export function LogInfo(message: string, ...args: LogArgument[]) {
    if (!shouldLog(LogLevel.INFO)) return;

    const timestamp = new Date().toISOString();

    if (isProduction) {
        console.log(`[${timestamp}] [INFO]  ${message}`, ...args);
        return;
    }

    const fileName = getCallerFileName();
    const formattedFileName = fileName ? formatFileName(fileName) : "";

    console.log(
        chalk.gray(`[${timestamp}]`) +
            chalk.blue(" [INFO] ") +
            (formattedFileName ? chalk.cyan(` [${formattedFileName}]`) : "") +
            chalk.white(` ${message}`),
        ...args
    );
}

/**
 * Logs WARN messages
 * @param {string} message - The WARN message to log
 * @param {LogArgument[]} args - Additional arguments to log
 */
export function LogWarning(message: string, ...args: LogArgument[]) {
    if (!shouldLog(LogLevel.WARN)) return;

    const timestamp = new Date().toISOString();

    if (isProduction) {
        console.warn(`[${timestamp}] [WARN]  ${message}`, ...args);
        return;
    }

    const fileName = getCallerFileName();
    const formattedFileName = fileName ? formatFileName(fileName) : "";

    console.warn(
        chalk.gray(`[${timestamp}]`) +
            chalk.yellow(" [WARN] ") +
            (formattedFileName ? chalk.cyan(` [${formattedFileName}]`) : "") +
            chalk.white(` ${message}`),
        ...args
    );
}

/**
 * Logs error messages
 * @param {string} message - The error message to log
 * @param {unknown} [err] - Optional error object
 * @param {LogArgument[]} args - Additional arguments to log
 */
export function LogError(message: string, err?: unknown, ...args: LogArgument[]): void {
    if (!shouldLog(LogLevel.ERROR)) return;

    const timestamp = new Date().toISOString();
    const errorMessage = err ? extractErrorMessage(err) : "";

    if (isProduction) {
        console.error(`[${timestamp}] [ERROR] ${message}`, errorMessage, ...args);
        return;
    }

    const fileName = getCallerFileName();
    const formattedFileName = fileName ? formatFileName(fileName) : "";

    console.error(
        chalk.gray(`[${timestamp}]`) +
            chalk.red(" [ERROR]") +
            (formattedFileName ? chalk.cyan(` [${formattedFileName}]`) : "") +
            chalk.white(` ${message}`),
        errorMessage ? chalk.red(`(${errorMessage})`) : "",
        ...args
    );
}

/**
 * Logs fatal error messages for critical system failures
 * @param {string} message - The fatal error message to log
 * @param {unknown} [err] - Optional error object
 * @param {LogArgument[]} args - Additional arguments to log
 */
export function LogFatal(message: string, err?: unknown, ...args: LogArgument[]): void {
    if (!shouldLog(LogLevel.FATAL)) return;

    const timestamp = new Date().toISOString();
    const errorMessage = err ? extractErrorMessage(err) : "";

    if (isProduction) {
        console.error(`[${timestamp}] [FATAL] ${message}`, errorMessage, ...args);
        return;
    }

    const fileName = getCallerFileName();
    const formattedFileName = fileName ? formatFileName(fileName) : "";

    console.error(
        chalk.gray(`[${timestamp}]`) +
            chalk.hex("#8B0000")(" [FATAL]") +
            (formattedFileName ? chalk.cyan(` [${formattedFileName}]`) : "") +
            chalk.white(` ${message}`),
        errorMessage ? chalk.hex("#8B0000")(`(${errorMessage})`) : "",
        ...args
    );
}

/**
 * Logs debug information (suppressed in production)
 * @param {LogArgument[]} data - Data to log
 */
export function LogDebug(...data: LogArgument[]) {
    if (!shouldLog(LogLevel.DEBUG)) return;

    if (isProduction) {
        return;
    }

    const timestamp = new Date().toISOString();
    const fileName = getCallerFileName();
    const formattedFileName = fileName ? formatFileName(fileName) : "";

    const formattedData = data
        .map(item => {
            if (typeof item === "object") {
                return JSON.stringify(item, null, 2);
            }
            return String(item);
        })
        .join(typeof data[0] === "object" ? "\n" : " ");

    console.debug(
        chalk.gray(`[${timestamp}]`) +
            chalk.magenta(" [DEBUG]") +
            (formattedFileName ? chalk.cyan(` [${formattedFileName}]`) : "") +
            (typeof data[0] === "object" ? "\n" : " ") +
            chalk.white(formattedData)
    );
}
