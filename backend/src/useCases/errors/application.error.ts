export class ApplicationError extends Error {
    constructor(
        public message: string,
        public code: number,
        public details?: Array<{ field: string; message: string }>,
        public status: string = "fail"
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    toResponse() {
        return {
            status: this.status,
            message: this.message
        };
    }
}
