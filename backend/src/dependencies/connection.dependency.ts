import { container } from "tsyringe";
import type { Pool } from "pg";
import type { TRedisClient } from "../repositories/types/redis.types";

export const registerConnectionDepedencies = (
    PostgresPool: Pool,
    RedisClient: TRedisClient,
) => {
    container.register<Pool>("PostgresPool", { useValue: PostgresPool });
    container.register<TRedisClient>("RedisClient", { useValue: RedisClient });
};
