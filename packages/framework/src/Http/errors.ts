export type ErrorBag = Record<string, string[]>;

export class HttpException extends Error {
    readonly status: number;
    readonly details?: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "HttpException";
        this.status = status;
        this.details = details;
    }
}

export class ValidationError extends HttpException {
    readonly errors: ErrorBag;

    constructor(errors: ErrorBag, message = "Validation failed") {
        super(422, message, { errors });
        this.name = "ValidationError";
        this.errors = errors;
    }
}