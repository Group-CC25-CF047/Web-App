import { ApplicationError } from "./application.error";

export class UnauthorizedError extends ApplicationError {
    constructor(message: string) {
        const code = 401;
        super(message, code);
        this.name = "UnauthorizedError";
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
