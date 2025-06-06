import { container } from "tsyringe";
import { RedisRepository } from "../repositories/redis/redis.repository";
import type { IRedisRepository } from "../repositories/redis/redis.repository";

export const registerRedisDependencies = () => {
    container.register<IRedisRepository>("RedisRepository", { useClass: RedisRepository });
};
