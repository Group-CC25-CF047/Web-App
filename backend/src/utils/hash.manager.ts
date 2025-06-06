import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { injectable } from "tsyringe";

/**
 * A utility class for performing various hashing operations.
 * This class is designed to be used with dependency injection (tsyringe).
 */
@injectable()
export class HashManager {
    /**
     * The number of salt rounds to use for bcrypt password hashing.
     * @private
     * @readonly
     */
    private readonly _saltRounds = 10;

    /**
     * Hashes the input data using the specified cryptographic algorithm.
     * Defaults to SHA-256.  Error handling is assumed to be done by the caller.
     *
     * @async
     * @function hashData
     * @param {string} data - The data to be hashed.
     * @param {string} [algorithm='sha256'] - The name of the hashing algorithm to use.
     *   Must be a supported algorithm by Node.js's `crypto.createHash()`.
     * @returns {Promise<string>} A Promise that resolves to the hexadecimal representation of the hash.
     * @throws {Error} Throws an error if the provided algorithm is not supported. **This error is not handled internally.**
     * @example
     * const data = "My secret message";
     * const hash = await hashManager.hashData(data); // Defaults to SHA-256
     * const sha512Hash = await hashManager.hashData(data, 'sha512');
     */
    public async hashData(data: string, algorithm: string = "sha256"): Promise<string> {
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        return hash.digest("hex");
    }

    /**
     * Compares raw data against a previously generated hash using the specified algorithm.
     *
     * @async
     * @function compareHash
     * @param {string} data - The raw data to compare.
     * @param {string} hash - The previously generated hash to compare against.
     * @param {string} [algorithm='sha256'] - The hashing algorithm that was used to create the hash.
     * @returns {Promise<boolean>} A Promise that resolves to `true` if the data matches the hash, `false` otherwise.
     * @example
     * const data = "My secret message";
     * const hash = await hashManager.hashData(data); // Generate the hash
     * const isMatch = await hashManager.compareHash(data, hash); // Compare
     * const isMismatch = await hashManager.compareHash("Different data", hash);
     */
    public async compareHash(
        data: string,
        hash: string,
        algorithm: string = "sha256"
    ): Promise<boolean> {
        const newHash = await this.hashData(data, algorithm);
        return newHash === hash;
    }

    /**
     * Generates a salted SHA-256 hash of the input data.  A random 16-byte salt
     * is prepended to the data before hashing, making it more resistant to
     * pre-computed rainbow table attacks.
     *
     * @async
     * @function hashWithSalt
     * @param {string} data - The data to be hashed.
     * @param {string} [salt] - An optional, user-provided salt.  If not provided, a random salt is generated.
     *   It's generally recommended to let the function generate the salt.
     * @returns {Promise<{ hash: string; salt: string }>} A Promise that resolves to an object containing the
     *   generated hash and the salt that was used.
     * @example
     * const data = "My secret message";
     * const { hash, salt } = await hashManager.hashWithSalt(data);
     */
    public async hashWithSalt(
        data: string,
        salt?: string
    ): Promise<{ hash: string; salt: string }> {
        const useSalt = salt || crypto.randomBytes(16).toString("hex");
        const hash = crypto.createHash("sha256");
        hash.update(useSalt + data); // Salt *before* data

        return {
            hash: hash.digest("hex"),
            salt: useSalt
        };
    }
    /**
     * Compares raw data against a previously generated salted hash.
     *
     * @async
     * @function compareDataWithSalt
     * @param {string} data - The raw data to compare.
     * @param {string} salt - The salt that was used to generate the hash.
     * @param {string} hash - The previously generated salted hash.
     * @returns {Promise<boolean>} A Promise that resolves to `true` if the data, salt, and hash match; `false` otherwise.
     * @example
     * const data = "My secret message";
     * const { hash, salt } = await hashManager.hashWithSalt(data); // Generate salted hash
     *
     * const isMatch = await hashManager.compareDataWithSalt(data, salt, hash);
     * const isMismatch = await hashManager.compareDataWithSalt("Different data", salt, hash);
     */
    public async compareDataWithSalt(data: string, salt: string, hash: string): Promise<boolean> {
        const newHash = await this.hashWithSalt(data, salt);
        return newHash.hash === hash;
    }

    /**
     * Hashes a password using the bcrypt algorithm. Bcrypt is a strong, adaptive
     * hashing algorithm designed specifically for password hashing.
     *
     * @async
     * @function hashPassword
     * @param {string} password - The plain-text password to hash.
     * @returns {Promise<string>} A Promise that resolves to the bcrypt hash of the password.
     * @example
     * const hashedPassword = await hashManager.hashPassword("MySuperSecretPassword!");
     */
    public async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this._saltRounds);
    }

    /**
     * Compares a plain-text password against a previously generated bcrypt hash.
     *
     * @async
     * @function comparePassword
     * @param {string} password - The plain-text password to compare.
     * @param {string} hash - The previously generated bcrypt hash.
     * @returns {Promise<boolean>} A Promise that resolves to `true` if the password matches the hash, `false` otherwise.
     * @example
     * const hashedPassword = await hashManager.hashPassword("MySuperSecretPassword!");
     *
     * const isMatch = await hashManager.comparePassword("MySuperSecretPassword!", hashedPassword);
     * const isMismatch = await hashManager.comparePassword("WrongPassword", hashedPassword);
     */
    public async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
