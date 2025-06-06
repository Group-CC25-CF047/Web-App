import * as Iron from "@hapi/iron";
import { Config } from "../config";
import { injectable } from "tsyringe";
import { LogError } from "./logger.manager";

/**
 * A utility class for performing secure encryption and decryption operations using @hapi/iron.
 * This class is designed to be used with dependency injection (tsyringe).
 */
@injectable()
export class EncryptionManager {
    /**
     * Default password to use for sealing/unsealing.
     * Using the configured cookie key from Settings.
     * @private
     */
    private _password: string = Config.key.cookieKey;

    /**
     * Sets the password used for sealing and unsealing data.
     *
     * @function setPassword
     * @param {string} password - The password to use for encryption/decryption operations.
     *   Should be at least 32 characters for adequate security.
     * @returns {void}
     * @throws {Error} If the password is too short (less than 32 characters).
     * @example
     * encryptionManager.setPassword("your-very-secure-and-long-password-here");
     */
    setPassword(password: string): void {
        if (password.length < 32) {
            LogError("Password must be at least 32 characters long for adequate security");
        }
        this._password = password;
    }

    /**
     * Encrypts (seals) data using @hapi/iron with a password.
     *
     * @async
     * @function seal
     * @param {T} data - The data to be encrypted. Can be any JSON-serializable value.
     * @param {Object} [options] - Optional configuration options.
     * @param {string} [options.password] - A custom password to use instead of the default.
     * @returns {Promise<string>} A Promise that resolves to the encrypted (sealed) string.
     * @throws {Error} If the sealing operation fails or the password is not secure enough.
     * @example
     * const data = { userId: 123, role: "admin" };
     * const sealed = await encryptionManager.seal(data);
     */
    public async seal<T>(data: T, options?: { password?: string }): Promise<string> {
        const password = options?.password || this._password;
        return Iron.seal(data, password, Iron.defaults);
    }

    /**
     * Decrypts (unseals) data that was previously sealed with @hapi/iron.
     *
     * @async
     * @function unseal
     * @param {string} sealed - The sealed (encrypted) string to decrypt.
     * @param {Object} [options] - Optional configuration options.
     * @param {string} [options.password] - A custom password to use instead of the default.
     * @returns {Promise<T>} A Promise that resolves to the original data with type T.
     * @throws {Error} If the unsealing operation fails, the seal is expired, or the password is incorrect.
     * @example
     * try {
     *   const sealed = "..."; // Previously sealed data
     *   const data = await encryptionManager.unseal<{ userId: number }>(sealed);
     * } catch (error) {
     *   console.error("Failed to unseal data:", error.message);
     * }
     */
    public async unseal<T = unknown>(sealed: string, options?: { password?: string }): Promise<T> {
        const password = options?.password || this._password;
        return Iron.unseal(sealed, password, Iron.defaults) as Promise<T>;
    }

    /**
     * Attempts to unseal data and returns whether the operation was successful.
     * This is useful for validating tokens without needing to handle exceptions.
     *
     * @async
     * @function isValid
     * @param {string} sealed - The sealed (encrypted) string to verify.
     * @param {Object} [options] - Optional configuration options.
     * @param {string} [options.password] - A custom password to use instead of the default.
     * @returns {Promise<boolean>} A Promise that resolves to true if the token can be unsealed, false otherwise.
     * @example
     * const sealed = await encryptionManager.seal({ userId: 123 });
     * const isValid = await encryptionManager.isValid(sealed);
     */
    public async isValid(sealed: string, options?: { password?: string }): Promise<boolean> {
        try {
            await this.unseal(sealed, options);
            return true;
        } catch (error) {
            LogError("Failed to validate sealed data:", error);
            return false;
        }
    }
}
