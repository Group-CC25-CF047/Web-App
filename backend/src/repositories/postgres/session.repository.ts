import type { Pool } from "pg";
import { injectable, inject } from "tsyringe";
import { Session } from "../entities/session.entity";
import {
    PostgresErrorHandling,
    PostgresCreationError,
    PostgresNotFoundError
} from "../errors/postgres.error";
import type { IRedisRepository } from "../redis/redis.repository";
import { Config } from "../../config";

export interface ISessionRepository {
    addSession(session: Session): Promise<string>;
    getSession(id: string): Promise<Session>;
    checkTokenExist(id: string): Promise<boolean>;
    checkSessionExistByUserId(userId: string): Promise<boolean>;
    deleteSession(id: string, userId: string): Promise<void>;
    deleteSessionByUserId(userId: string): Promise<void>;
    deleteExpiredSessions(): Promise<void>;
}

@injectable()
export class SessionRepository implements ISessionRepository {
    constructor(
        @inject("PostgresPool") private readonly _pool: Pool,
        @inject("RedisRepository") private readonly _redisRepository: IRedisRepository,
        @inject("Session") private readonly _sessionFactory: typeof Session
    ) {}

    public async getSession(id: string): Promise<Session> {
        return PostgresErrorHandling(async () => {
            const cachedSession = await this._redisRepository.getTableRow("session", "details", id);
            if (cachedSession) {
                return new this._sessionFactory(cachedSession as unknown as Session);
            }

            const sessionQuery = {
                text: `
                    SELECT
                        id,
                        user_id,
                        token,
                        user_agent,
                        expires_at,
                        created_at,
                        updated_at
                    FROM sessions
                    WHERE id = $1
                    LIMIT 1
                `,
                values: [id]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                throw new PostgresNotFoundError("Session not found");
            }
            const sessionData = sessionResult.rows[0];
            const session = new this._sessionFactory(sessionData);

            await this._redisRepository.setTableRow(
                "session",
                "details",
                id,
                sessionData,
                Config.ttl.cache
            );

            return session;
        });
    }

    public async checkTokenExist(id: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const sessionQuery = {
                text: `
                    SELECT EXISTS(
                        SELECT 1 FROM sessions WHERE id = $1
                    ) AS exists
                `,
                values: [id]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                return false;
            }
            return sessionResult.rows[0].exists;
        });
    }

    public async checkSessionExistByUserId(userId: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const sessionQuery = {
                text: `
                    SELECT EXISTS(
                        SELECT 1 FROM sessions WHERE user_id = $1
                    ) AS exists
                `,
                values: [userId]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                return false;
            }
            return sessionResult.rows[0].exists;
        });
    }

    public async addSession(session: Session): Promise<string> {
        return PostgresErrorHandling(async () => {
            const sessionQuery = {
                text: `
                    INSERT INTO sessions (
                        user_id,
                        token,
                        user_agent,
                        expires_at
                    ) VALUES ($1, $2, $3, $4)
                    RETURNING id
                `,
                values: [session.user_id, session.token, session.user_agent, session.expires_at]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                throw new PostgresCreationError("Session not created");
            }
            return sessionResult.rows[0].id;
        });
    }

    public async deleteSession(id: string, userId: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const sessionQuery = {
                text: `
                    DELETE FROM sessions
                    WHERE id = $1 AND user_id = $2
                `,
                values: [id, userId]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                throw new PostgresNotFoundError("Session not found");
            }
            await this._redisRepository.deleteTableRow("session", "details", id);
        });
    }

    public async deleteSessionByUserId(userId: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const sessionIdsQuery = {
                text: `
                    SELECT id
                    FROM sessions
                    WHERE user_id = $1
                `,
                values: [userId]
            };
            const sessionIdsResult = await this._pool.query(sessionIdsQuery);
            const sessionIds = sessionIdsResult.rows.map(row => row.id);
            
            const sessionQuery = {
                text: `
                    DELETE FROM sessions
                    WHERE user_id = $1
                `,
                values: [userId]
            };
            const sessionResult = await this._pool.query(sessionQuery);
            if (sessionResult.rowCount === 0) {
                throw new PostgresNotFoundError("Session not found");
            }
            
            for (const sessionId of sessionIds) {
                await this._redisRepository.deleteTableRow("session", "details", sessionId);
            }
        });
    }

    public async deleteExpiredSessions(): Promise<void> {
        return PostgresErrorHandling(async () => {
            const expiredSessionIdsQuery = {
                text: `
                    SELECT id
                    FROM sessions
                    WHERE expires_at < NOW()
                `
            };
            const expiredSessionIdsResult = await this._pool.query(expiredSessionIdsQuery);
            const expiredSessionIds = expiredSessionIdsResult.rows.map(row => row.id);
            
            if (expiredSessionIds.length === 0) {
                return;
            }
            
            const sessionQuery = {
                text: `
                    DELETE FROM sessions
                    WHERE expires_at < NOW()
                `
            };
            await this._pool.query(sessionQuery);
            
            for (const sessionId of expiredSessionIds) {
                await this._redisRepository.deleteTableRow("session", "details", sessionId);
            }
        });
    }
}
