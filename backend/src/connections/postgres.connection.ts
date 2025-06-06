import * as pg from "pg";
const { Pool } = pg;
import type { Pool as IPool } from "pg";
import { Config } from "../config";
import { LogFatal, LogInfo } from "../utils/logger.manager";

export const createPostgresConnection = async () => {
    const pool = new Pool({
        user: Config.database.user,
        host: Config.database.host,
        database: Config.database.database,
        password: Config.database.password,
        port: Config.database.port
    });

    try {
        const client = pool.connect();
        (await client).release();
        LogInfo("PostgreSQL connected successfully");
        return pool;
    } catch (error) {
        LogFatal("Failed to connect to PostgreSQL", error);
        process.exit(1);
    }
};

export const shutdownPostgresConnection = async (pool: IPool) => {
    await pool.end();
};
