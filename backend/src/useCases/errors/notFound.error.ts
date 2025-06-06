import { ApplicationError } from "./application.error";

export class NotFoundError extends ApplicationError {
    constructor(message: string) {
        const code = 404;
        super(message, code);
        this.name = "NotFoundError";
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
