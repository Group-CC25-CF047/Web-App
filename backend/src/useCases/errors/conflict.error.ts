import { ApplicationError } from "./application.error";

export class ConflictError extends ApplicationError {
    constructor(message: string) {
        const code = 409;
        super(message, code);
        this.name = "ConflictError";
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
