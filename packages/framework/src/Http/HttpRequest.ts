import type { HttpRequestProps } from "./interfaces/HttpRequestPropsInterface";
import type { Session } from "./Session";
import { ValidationError, type ErrorBag } from "./errors";

type PrimitiveType = "string" | "number" | "boolean" | "array" | "object";

export interface ValidationRule {
    required?: boolean;
    type?: PrimitiveType;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown, data: Record<string, unknown>) => string | null | undefined;
}

export type ValidationRules = Record<string, ValidationRule>;

const detectType = (value: unknown): PrimitiveType | "null" => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value as PrimitiveType;
};

export class HttpRequest {
    readonly method: string;
    readonly url: URL;
    readonly headers: Headers;
    readonly query: URLSearchParams;
    readonly body: unknown;
    readonly session?: Session;
    private _params: Record<string, string> = {};

    constructor (props: HttpRequestProps) {
        this.method = props.method.toUpperCase();
        this.url = new URL(props.url);
        this.headers = props.headers;
        this.query = props.query;
        this.body = props.body;
        this.session = props.session;
    }

    json <T = any>(): T | null {
        return typeof this.body === "object" ? (this.body as T) : null;
    }

    header (name: string): string | null {
        return this.headers.get(name);
    }

    input (key: string): unknown {
        return this.query.get(key);
    }

    params (key: string): string | undefined {
        return this._params[key];
    }

    path (): string {
        return new URL (this.url).pathname;
    }

    all (): Record<string, unknown> {
        const queryObj = Object.fromEntries(this.query.entries());
        const bodyObj = typeof this.body === "object" && this.body !== null ?
            this.body as Record<string, unknown> : {};

        return { ...queryObj, ...bodyObj };
    }

    isJson (): boolean {
        return (this.headers.get("content-type") || "").includes("application/json");
    }

    wantsJson(): boolean {
        const accept = (this.header("accept") || "").toLowerCase();
        return this.isJson() || accept.includes("application/json");
    }

    setParams (params: Record<string, string>) {
        this._params = params;
    }

    validate(rules: ValidationRules): Record<string, unknown> {
        const data = this.all();
        const errors: ErrorBag = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const isMissing = value === undefined || value === null || value === "";

            if (rule.required && isMissing) {
                errors[field] = [...(errors[field] ?? []), `${field} is required`];
                continue;
            }

            if (isMissing) {
                continue;
            }

            const valueType = detectType(value);

            if (rule.type && valueType !== rule.type) {
                errors[field] = [...(errors[field] ?? []), `${field} must be a ${rule.type}`];
            }

            if (typeof value === "string") {
                if (typeof rule.minLength === "number" && value.length < rule.minLength) {
                    errors[field] = [...(errors[field] ?? []), `${field} must be at least ${rule.minLength} characters`];
                }

                if (typeof rule.maxLength === "number" && value.length > rule.maxLength) {
                    errors[field] = [...(errors[field] ?? []), `${field} must be at most ${rule.maxLength} characters`];
                }

                if (rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = [...(errors[field] ?? []), `${field} format is invalid`];
                }
            }

            if (typeof value === "number") {
                if (typeof rule.min === "number" && value < rule.min) {
                    errors[field] = [...(errors[field] ?? []), `${field} must be at least ${rule.min}`];
                }

                if (typeof rule.max === "number" && value > rule.max) {
                    errors[field] = [...(errors[field] ?? []), `${field} must be at most ${rule.max}`];
                }
            }

            if (rule.custom) {
                const customError = rule.custom(value, data);
                if (customError) {
                    errors[field] = [...(errors[field] ?? []), customError];
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }

        return data;
    }


}