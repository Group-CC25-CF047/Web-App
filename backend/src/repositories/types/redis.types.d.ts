import type {
    RedisClientType as BaseRedisClientType,
    RedisModules,
    RedisFunctions,
    RedisScripts
} from "redis";

// Define the specific Redis client type with all its modules
export type TRedisClient = BaseRedisClientType<RedisModules, RedisFunctions, RedisScripts>;
