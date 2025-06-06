import type { TRedisClient } from "../repositories/types/redis.types";
import redis from "redis";
import { Config } from "../config";
import { LogFatal, LogInfo } from "../utils/logger.manager";

export const createRedisConnection = async (): Promise<TRedisClient> => {
    const client = redis.createClient({
        socket: {
            host: Config.redis.host,
            port: Number(Config.redis.port)
        },
        password: Config.redis.password
    });

    try {
        await client.connect();
        LogInfo("Redis Client connected successfully");
        return client as TRedisClient;
    } catch (error) {
        LogFatal("Failed to connect to Redis:", error);
        process.exit(1);
    }
};

export const shutdownRedisConnection = async (client: TRedisClient): Promise<void> => {
    await client.quit();
};
