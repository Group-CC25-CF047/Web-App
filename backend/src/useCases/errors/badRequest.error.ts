import { ApplicationError } from "./application.error";

export class BadRequestError extends ApplicationError {
    constructor(message: string) {
        const code = 400;
        super(message, code);
        this.name = "BadRequestError";
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
