import type { ValidationError, GeneralError } from "./error";

export interface SuccessResponse {
    status: string;
    message: string;
    data?: {
        [key: string]: string | number | boolean | object;
    };
}

export type ApiResponse = SuccessResponse | ValidationError | GeneralError;
