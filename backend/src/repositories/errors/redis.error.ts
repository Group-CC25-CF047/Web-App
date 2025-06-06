import { InfrastructureError } from "./infrastructure.error";

class RedisError extends InfrastructureError {
    constructor(message: string) {
        super(message);
        this.name = "RedisError";
    }
}

export async function RedisErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof Error) {
            throw new RedisError(`Redis error: ${error.message}`);
        }
        throw new RedisError("Redis error: Unknown Error");
    }
}
