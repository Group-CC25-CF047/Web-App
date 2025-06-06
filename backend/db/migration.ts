// filepath: /home/ubuntu/Documents/GiziLens/backend/db/migration.ts
import { readdir, readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import * as pg from "pg";
import { Config } from "../src/config";
import { LogInfo, LogError, LogFatal } from "../src/utils/logger.manager";
import { existsSync } from "fs";

async function combineAndMoveSqlFiles() {
    try {
        const migrationDir = join(__dirname, "migration");
        const files = await readdir(migrationDir);

        const sqlFiles = files
            .filter(file => file.endsWith(".sql"))
            .sort((a, b) => {
                const prefixA = a.split("-")[0];
                const prefixB = b.split("-")[0];

                return prefixA.localeCompare(prefixB, undefined, { numeric: true });
            });

        LogInfo(`Found ${sqlFiles.length} SQL files to combine`);

        const destDir = join(process.cwd(), "../.config/postgres/migrations");
        if (!existsSync(destDir)) {
            await mkdir(destDir, { recursive: true });
            LogInfo(`Created directory: ${destDir}`);
        }

        let combinedSql = "";
        for (const file of sqlFiles) {
            const filePath = join(migrationDir, file);
            const sql = await readFile(filePath, "utf-8");
            combinedSql += `-- File: ${file}\n${sql}\n\n`;
        }

        try {
            const destFile = join(destDir, `new_migration.db`);
            
            // Check if the file exists and remove it
            if (existsSync(destFile)) {
                await unlink(destFile);
                LogInfo(`Removed existing migration file: ${destFile}`);
            }
            
            await writeFile(destFile, combinedSql);
            LogInfo(`Combined SQL files and saved to: ${destFile}`);
            return destFile;
        } catch (error) {
            LogError("Failed to save combined SQL file", error);
            throw error;
        }
    } catch (error) {
        LogError("Failed to combine and move SQL files", error);
        throw error;
    }
}

async function runMigrations() {
    const combinedSqlFile = await combineAndMoveSqlFiles();

    const { Pool } = pg;
    const pool = new Pool({
        user: Config.database.user,
        host: Config.database.host,
        database: Config.database.database,
        password: Config.database.password,
        port: Config.database.port
    });

    try {
        LogInfo(`Executing combined migration file: ${combinedSqlFile}`);
        const sql = await readFile(combinedSqlFile, "utf-8");

        try {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                await client.query(sql);
                await client.query("COMMIT");
                LogInfo(`Migration successful for combined file`);
            } catch (err) {
                await client.query("ROLLBACK");
                LogError(`Migration failed for combined file`, err);
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            LogError(`Failed to execute combined SQL file`, err);
            throw err;
        }

        LogInfo("Combined migration completed successfully");
    } catch (error) {
        LogFatal("Migration process failed", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (process.argv[1] === __filename) {
    if (process.env.NODE_ENV === undefined) {
        process.env.NODE_ENV = "development";
    }

    import("reflect-metadata").then(() => {
        LogInfo(`Starting migrations in ${process.env.NODE_ENV} mode`);
        runMigrations()
            .then(() => {
                LogInfo("Migration completed, exiting...");
                process.exit(0);
            })
            .catch(err => {
                LogFatal("Migration failed", err);
                process.exit(1);
            });
    });
}

export { runMigrations };
