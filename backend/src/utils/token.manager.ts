import Jwt from "@hapi/jwt";
import { Config } from "../config";
import { injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type { IJwtPayload } from "../dto/session.dto";

/**
 * A utility class for managing JWT tokens for authentication and authorization.
 * This class is designed to be used with dependency injection (tsyringe).
 */
@injectable()
export class TokenManager {
    private readonly _accessKey = Config.key.accessJwtKey;
    private readonly _refreshKey = Config.key.refreshJwtKey;

    /**
     * Creates a new JWT access token with the provided payload.
     * Adds timestamp and unique identifier to the token.
     *
     * @async
     * @function createAccessToken
     * @param {object} payload - The data to be included in the token.
     * @returns {Promise<string>} A Promise that resolves to the generated JWT access token.
     * @example
     * const payload = { userId: "123", role: "user" };
     * const token = await tokenManager.createAccessToken(payload);
     */
    public async createAccessToken(payload: object): Promise<string> {
        const completePayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            jti: uuidv4()
        };
        return Jwt.token.generate(completePayload, this._accessKey);
    }

    /**
     * Creates a new JWT refresh token with the provided payload.
     * Adds timestamp and unique identifier to the token.
     *
     * @async
     * @function createRefreshToken
     * @param {object} payload - The data to be included in the token.
     * @returns {Promise<string>} A Promise that resolves to the generated JWT refresh token.
     * @example
     * const payload = { userId: "123", role: "user" };
     * const token = await tokenManager.createRefreshToken(payload);
     */
    public async createRefreshToken(payload: object): Promise<string> {
        const completePayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            jti: uuidv4()
        };
        return Jwt.token.generate(completePayload, this._refreshKey);
    }

    /**
     * Verifies a JWT token and returns its payload.
     *
     * @async
     * @function verifyToken
     * @param {string} token - The JWT token to verify.
     * @returns {Promise<IJwtPayload>} A Promise that resolves to the decoded payload from the token.
     * @throws {Error} Throws an error if the token signature is invalid.
     * @example
     * try {
     *   const payload = await tokenManager.verifyToken(token);
     *   console.log(payload.userId);
     * } catch (error) {
     *   console.error("Invalid token");
     * }
     */
    public async verifyToken(token: string): Promise<IJwtPayload> {
        const artifacts = Jwt.token.decode(token);
        Jwt.token.verifySignature(artifacts, this._refreshKey);
        return artifacts.decoded.payload;
    }
}
