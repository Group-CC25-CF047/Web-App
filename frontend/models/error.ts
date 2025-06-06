export interface ValidationError {
    status: string;
    message: string;
    details: Array<{
        field: string;
        message: string;
    }>;
}

export interface GeneralError {
    status: string;
    message: string;
}

export interface ValidationErrors {
    [field: string]: string;
}

export interface ErrorWithMessage {
    message: string;
}
