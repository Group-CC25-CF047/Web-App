import "reflect-metadata";
import { LogError, LogInfo } from "./utils/logger.manager";
import { createPostgresConnection } from "./connections/postgres.connection";
import { createRedisConnection } from "./connections/redis.connection";
import { createServer } from "./connections/hapi.connection";
import { registerConnectionDepedencies } from "./dependencies/connection.dependency";
import { registerUserDependencies } from "./dependencies/users.dependency";
import { registerUtilsDependencies } from "./dependencies/utils.dependency";
import { registerRedisDependencies } from "./dependencies/redis.dependency";
import { registerSessionDependencies } from "./dependencies/sessions.dependency";
import { shutdownServer } from "./connections/hapi.connection";
import { shutdownRedisConnection } from "./connections/redis.connection";
import { shutdownPostgresConnection } from "./connections/postgres.connection";

/**
 * Initializes the application.
 *
 * This function orchestrates the setup of the application, including:
 * 1. Establishing connections to PostgreSQL and Redis.
 * 2. Registering dependency injection containers for various modules (database, users, admins, security).
 * 3. Creating and starting the Hapi server.
 * 4. Setting up signal handlers for graceful shutdown (SIGINT, SIGTERM) and handling unhandled promise rejections.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the application has been initialized successfully.  Rejects on fatal error.
 *
 * @throws {Error} If any error occurs during initialization (database connection, server start, etc.).
 */
const init = async (): Promise<void> => {
    /**
     * @type {boolean} Flag to ensure shutdown only occurs once.
     */
    let isShuttingDown = false;

    let postgresPool;
    let redisClient;
    let server;

    try {
        // Establish all connections in parallel
        const [postgresConnectionResult, redisConnectionResult] = await Promise.all([
            createPostgresConnection(),
            createRedisConnection()
        ]);

        postgresPool = postgresConnectionResult;
        redisClient = redisConnectionResult;

        LogInfo("All connections established successfully");

        // Register dependencies (keeping sequential as they may have interdependencies)
        registerConnectionDepedencies(postgresPool, redisClient);

        // These could potentially be grouped and parallelized if we confirm they're independent
        await Promise.all([
            registerUserDependencies(),
            registerSessionDependencies(),
            registerRedisDependencies(),
            registerUtilsDependencies()
        ]);

        server = await createServer();
        await server.start();
        LogInfo("Server running on %s", server.info.uri);
    } catch (error) {
        LogError("Fatal error during initialization:", error);
        process.exit(1); //Exit immediately if core setup fails.
    }

    /**
     * Handles the SIGINT signal (typically Ctrl+C) to initiate a graceful shutdown.
     * @async
     * @param {NodeJS.Signals} _signal - The signal name.  (Unused, but present for signal handler compatibility).
     * @returns {Promise<void>}
     */
    process.on("SIGINT", async (_signal: NodeJS.Signals) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        LogInfo("Starting graceful shutdown...");

        try {
            LogInfo("Closing PostgreSQL connection...");
            await shutdownPostgresConnection(postgresPool);
            LogInfo("PostgreSQL connection closed.");

            LogInfo("Closing Redis connection...");
            await shutdownRedisConnection(redisClient);
            LogInfo("Redis connection closed.");

            LogInfo("Stopping server...");
            await shutdownServer(server);
            LogInfo("Server stopped.");

            LogInfo("All connections closed, exiting process...");
            process.exit(0);
        } catch (error) {
            console.error("Error during shutdown:", error);
            process.exit(1);
        }
    });

    /**
     * Handles the SIGTERM signal (typically sent by process managers) by forwarding to SIGINT.
     * @listens process#SIGTERM
     */
    process.on("SIGTERM", () => {
        LogInfo("SIGTERM received");
        process.emit("SIGINT"); // Re-use SIGINT handler.
    });

    /**
     * Handles unhandled promise rejections, logs the error, and exits the process.
     *
     * @param {Error} err - The unhandled rejection error.
     * @listens process#unhandledRejection
     */
    process.on("unhandledRejection", (err: Error) => {
        console.error("Unhandled Rejection:", err);
        process.exit(1);
    });
};

init().catch(error => {
    console.error("Fatal error during initialization:", error);
    process.exit(1);
});
