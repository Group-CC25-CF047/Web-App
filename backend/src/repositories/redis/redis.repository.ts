import type { TRedisClient } from "../types/redis.types";
import { HashManager } from "../../utils/hash.manager";
import { injectable, inject } from "tsyringe";
import { RedisErrorHandling } from "../errors/redis.error";

interface IRedisTableRow {
    [key: string]: string | number | boolean;
}

export interface IRedisRepository {
    setTableRow(
        parameter: string,
        additionalInfo: string,
        rowKey: string,
        rowData: IRedisTableRow,
        expireTime: number
    ): Promise<void>;
    getTableRow(
        parameter: string,
        additionalInfo: string,
        rowKey: string
    ): Promise<IRedisTableRow | null>;
    deleteTableRow(parameter: string, additionalInfo: string, rowKey: string): Promise<void>;

    setArrayData<T>(
        parameter: string,
        additionalInfo: string,
        rowKey: string,
        arrayData: T[],
        expireTime?: number
    ): Promise<void>;
    getArrayData<T>(parameter: string, additionalInfo: string, rowKey: string): Promise<T[] | null>;
    deleteArrayData(parameter: string, additionalInfo: string, rowKey: string): Promise<void>;
}

@injectable()
export class RedisRepository implements IRedisRepository {
    constructor(
        @inject("RedisClient") private readonly _client: TRedisClient,
        @inject("HashManager") private readonly _hashManager: HashManager
    ) {}

    private async _getCachedKey(
        parameter: string,
        addtionalInfo: string,
        key: string
    ): Promise<string> {
        const hashedKey = await this._hashManager.hashData(key);
        return `${parameter}:${addtionalInfo}:${hashedKey}`;
    }

    public async setTableRow(
        parameter: string,
        additionalInfo: string,
        rowKey: string,
        rowData: IRedisTableRow,
        expireTime: number
    ): Promise<void> {
        return RedisErrorHandling(async () => {
            const cachedKey = await this._getCachedKey(parameter, additionalInfo, rowKey);
            const redisData: Record<string, string> = {};
            for (const key in rowData) {
                redisData[key] = String(rowData[key]);
            }

            await this._client.hSet(cachedKey, redisData);
            if (expireTime > 0) {
                await this._client.expire(cachedKey, expireTime);
            }
        });
    }

    public async getTableRow(
        parameter: string,
        addtionalInfo: string,
        rowKey: string
    ): Promise<IRedisTableRow | null> {
        return RedisErrorHandling(async () => {
            const cachedKey = await this._getCachedKey(parameter, addtionalInfo, rowKey);
            const data = await this._client.hGetAll(cachedKey);

            if (Object.keys(data).length === 0) {
                return null;
            }

            const tableRow: IRedisTableRow = {};
            for (const key in data) {
                if (key === "last_name") {
                    tableRow[key] = data[key];
                } else {
                    const numValue = Number(data[key]);
                    tableRow[key] = isNaN(numValue) ? data[key] : numValue;
                }
            }

            return tableRow;
        });
    }

    public async setArrayData<T>(
        parameter: string,
        additionalInfo: string,
        rowKey: string,
        arrayData: T[],
        expireTime?: number
    ): Promise<void> {
        return RedisErrorHandling(async () => {
            const cachedKey = await this._getCachedKey(parameter, additionalInfo, rowKey);
            const redisData: Record<string, string> = {};

            redisData["length"] = String(arrayData.length);

            arrayData.forEach((item, index) => {
                redisData[String(index)] =
                    typeof item === "object" ? JSON.stringify(item) : String(item);
            });

            await this._client.hSet(cachedKey, redisData);
            if (expireTime && expireTime > 0) {
                await this._client.expire(cachedKey, expireTime);
            }
        });
    }

    public async getArrayData<T>(
        parameter: string,
        additionalInfo: string,
        rowKey: string
    ): Promise<T[] | null> {
        return RedisErrorHandling(async () => {
            const cachedKey = await this._getCachedKey(parameter, additionalInfo, rowKey);
            const data = await this._client.hGetAll(cachedKey);

            if (Object.keys(data).length === 0) {
                return null;
            }

            const length = parseInt(data["length"] || "0", 10);
            if (length === 0) {
                return [];
            }

            const resultArray: T[] = new Array(length);
            for (let i = 0; i < length; i++) {
                const value = data[String(i)];

                try {
                    resultArray[i] = JSON.parse(value) as T;
                } catch {
                    const numValue = Number(value);
                    if (!isNaN(numValue) && value !== "") {
                        resultArray[i] = numValue as unknown as T;
                    } else if (value === "true") {
                        resultArray[i] = true as unknown as T;
                    } else if (value === "false") {
                        resultArray[i] = false as unknown as T;
                    } else {
                        resultArray[i] = value as unknown as T;
                    }
                }
            }

            return resultArray;
        });
    }

    public async deleteArrayData(
        parameter: string,
        additionalInfo: string,
        rowKey: string
    ): Promise<void> {
        return this.deleteTableRow(parameter, additionalInfo, rowKey);
    }

    public async deleteTableRow(
        parameter: string,
        addtionalInfo: string,
        rowKey: string
    ): Promise<void> {
        return RedisErrorHandling(async () => {
            const cachedKey = await this._getCachedKey(parameter, addtionalInfo, rowKey);
            await this._client.del(cachedKey);
        });
    }
}
