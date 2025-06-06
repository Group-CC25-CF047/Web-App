import { ApplicationError } from "./application.error";

export class ForbiddenError extends ApplicationError {
    constructor(message = "Forbidden access.") {
        const code = 403;
        super(message, code);
        this.name = "ForbiddenError";
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
