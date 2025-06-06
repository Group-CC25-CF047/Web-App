import { ApplicationError } from "./application.error";
import type { IValidationDTO } from "../../dto/validation.dto";

export class InvariantError extends ApplicationError {
    constructor(details: IValidationDTO[]) {
        super("Invalid Validation", 422, details);
        this.name = "InvariantError";
    }

    toResponse() {
        return {
            status: "fail",
            message: this.message,
            details: this.details
        };
    }
}
