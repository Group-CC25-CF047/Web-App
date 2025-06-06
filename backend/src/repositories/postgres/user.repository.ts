import type { TUserPassword, TUserUpdate } from "../types/user.types";
import type { IRedisRepository } from "../redis/redis.repository";
import type { Pool } from "pg";
import { Config } from "../../config";
import { User } from "../entities/user.entity";
import { injectable, inject } from "tsyringe";
import {
    PostgresErrorHandling,
    PostgresCreationError,
    PostgresNotFoundError,
    PostgresNoUpdateFieldsError
} from "../errors/postgres.error";

export interface IUserRepository {
    getUserById(id: string): Promise<User>;
    getUserIdAndPasswordByEmail(email: string): Promise<TUserPassword>;
    checkUserExistsByEmail(email: string): Promise<boolean>;
    checkUserExistsById(id: string): Promise<boolean>;
    checkAnyUserExistsById(id: string): Promise<boolean>;
    checkDeletedUserExistsById(id: string): Promise<boolean>;
    addUser(user: User): Promise<string>;
    updateUserPassword(id: string, password: string): Promise<void>;
    updateUser(user: TUserUpdate): Promise<void>;
    updateUserPhoto(id: string, photoUrl: string): Promise<void>;
    softDeleteUser(id: string): Promise<void>;
    undeleteUser(id: string): Promise<void>;
}

@injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @inject("PostgresPool") private readonly _pool: Pool,
        @inject("RedisRepository") private readonly _redisRepository: IRedisRepository,
        @inject("User") private readonly _userFactory: typeof User
    ) {}

    public async getUserById(id: string): Promise<User> {
        return PostgresErrorHandling(async () => {
            const cachedUser = await this._redisRepository.getTableRow("user", "details", id);
            if (cachedUser) {
                return new this._userFactory(cachedUser as unknown as typeof userData);
            }

            const userQuery = {
                text: `
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        password,
                        role,
                        photo,
                        created_at,
                        updated_at,
                        created_by,
                        updated_by,
                        is_deleted
                    FROM users
                    WHERE id = $1 AND is_deleted = FALSE
                    LIMIT 1
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new Error("User not found");
            }
            const userData = userResult.rows[0];
            const user = new this._userFactory(userData);

            await this._redisRepository.setTableRow(
                "user",
                "details",
                id,
                userData,
                Config.ttl.cache
            );

            return user;
        });
    }

    public async getUserIdAndPasswordByEmail(email: string): Promise<TUserPassword> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    SELECT id, password
                    FROM users
                    WHERE email = $1 AND is_deleted = FALSE
                    LIMIT 1
                `,
                values: [email]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                return null;
            }
            return userResult.rows[0];
        });
    }

    public async checkUserExistsByEmail(email: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    SELECT EXISTS (
                        SELECT 1
                        FROM users
                        WHERE email = $1 AND is_deleted = FALSE
                    )
                `,
                values: [email]
            };
            const userResult = await this._pool.query(userQuery);
            return userResult.rows[0]?.exists ?? false;
        });
    }

    public async checkUserExistsById(id: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    SELECT EXISTS (
                        SELECT 1
                        FROM users
                        WHERE id = $1 AND is_deleted = FALSE
                    )
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            return userResult.rows[0]?.exists ?? false;
        });
    }

    public async checkAnyUserExistsById(id: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    SELECT EXISTS (
                        SELECT 1
                        FROM users
                        WHERE id = $1
                    )
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            return userResult.rows[0]?.exists ?? false;
        });
    }

    public async checkDeletedUserExistsById(id: string): Promise<boolean> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    SELECT EXISTS (
                        SELECT 1
                        FROM users
                        WHERE id = $1 AND is_deleted = TRUE
                    )
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            return userResult.rows[0]?.exists ?? false;
        });
    }

    public async addUser(user: User): Promise<string> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    INSERT INTO users (
                        first_name,
                        last_name,
                        password,
                        email,
                        role,
                        photo
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `,
                values: [
                    user.first_name,
                    user.last_name,
                    user.password,
                    user.email,
                    user.role,
                    user.photo
                ]
            };
            const userResult = await this._pool.query(userQuery);
            if (!userResult.rows[0]) {
                throw new PostgresCreationError("Failed to create user.");
            }

            return userResult.rows[0].id;
        });
    }

    public async updateUserPassword(id: string, password: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    UPDATE users
                    SET password = $1
                    WHERE id = $2 AND is_deleted = FALSE
                `,
                values: [password, id]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new PostgresNotFoundError();
            }
            await this._redisRepository.deleteTableRow("user", "details", id);
        });
    }

    public async updateUser(user: TUserUpdate): Promise<void> {
        return PostgresErrorHandling(async () => {
            const fields: string[] = [];
            const values: (string | number)[] = [];
            let index = 1;

            if (user.first_name) {
                fields.push(`first_name = $${index++}`);
                values.push(user.first_name);
            }
            if (user.last_name) {
                fields.push(`last_name = $${index++}`);
                values.push(user.last_name);
            }
            if (user.email) {
                fields.push(`email = $${index++}`);
                values.push(user.email);
            }

            if (fields.length === 0) {
                throw new PostgresNoUpdateFieldsError();
            }

            const userQuery = {
                text: `
                    UPDATE users
                    SET ${fields.join(", ")}
                    WHERE id = $${index} AND is_deleted = FALSE
                `,
                values: [...values, user.id]
            };

            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new PostgresNotFoundError();
            }
            await this._redisRepository.deleteTableRow("user", "details", user.id);
        });
    }

    public async updateUserPhoto(id: string, photoUrl: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    UPDATE users
                    SET photo = $1
                    WHERE id = $2 AND is_deleted = FALSE
                `,
                values: [photoUrl, id]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new PostgresNotFoundError();
            }
            await this._redisRepository.deleteTableRow("user", "details", id);
        });
    }

    public async softDeleteUser(id: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    UPDATE users
                    SET is_deleted = TRUE
                    WHERE id = $1 AND is_deleted = FALSE
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new PostgresNotFoundError();
            }
            await this._redisRepository.deleteTableRow("user", "details", id);
        });
    }

    public async undeleteUser(id: string): Promise<void> {
        return PostgresErrorHandling(async () => {
            const userQuery = {
                text: `
                    UPDATE users
                    SET is_deleted = FALSE
                    WHERE id = $1 AND is_deleted = TRUE
                `,
                values: [id]
            };
            const userResult = await this._pool.query(userQuery);
            if (userResult.rowCount === 0) {
                throw new PostgresNotFoundError();
            }
            await this._redisRepository.deleteTableRow("user", "details", id);
        });
    }
}
