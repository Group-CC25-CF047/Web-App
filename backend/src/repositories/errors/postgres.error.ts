import { InfrastructureError } from "./infrastructure.error";

class PostgresError extends InfrastructureError {
    constructor(message: string) {
        super(message);
        this.name = "PostgresError";
    }
}

export class PostgresCreationError extends PostgresError {
    constructor(message: string) {
        super(message);
        this.name = "PostgresCreationError";
    }
}

export class PostgresNotFoundError extends PostgresError {
    constructor(message: string = "Data not found") {
        super(message);
        this.name = "PostgresNotFoundError";
    }
}

export class PostgresUpdateError extends PostgresError {
    constructor(message: string) {
        super(message);
        this.name = "PostgresUpdateError";
    }
}

export class PostgresNoUpdateFieldsError extends PostgresUpdateError {
    constructor() {
        super("No fields to update");
        this.name = "PostgresNoUpdateFieldsError";
    }
}

export async function PostgresErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof Error) {
            throw new PostgresError(`Postgres error: ${error.message}`);
        }
        throw new PostgresError("Postgres error: Unknown Error");
    }
}
