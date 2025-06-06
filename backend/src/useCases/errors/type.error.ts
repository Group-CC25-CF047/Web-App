import { ApplicationError } from "./application.error";
import type { IValidationDTO } from "../../dto/validation.dto";

export class UnsupportedMediaTypeError extends ApplicationError {
    constructor(details: IValidationDTO[]) {
        super("Invalid Validation", 415, details);
        this.name = "UnsupportedMediaTypeError";
    }

    toResponse() {
        return {
            status: "fail",
            message: this.message,
            details: this.details
        };
    }
}
