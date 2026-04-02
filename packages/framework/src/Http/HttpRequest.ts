import type { HttpRequestProps } from "./interfaces/HttpRequestPropsInterface";

export class HttpRequest {
    readonly method: string;
    readonly url: URL;
    readonly headers: Headers;
    readonly query: URLSearchParams;
    readonly body: unknown;
    private _params: Record<string, string> = {};

    constructor (props: HttpRequestProps) {
        this.method = props.method.toUpperCase();
        this.url = new URL(props.url);
        this.headers = props.headers;
        this.query = props.query;
        this.body = props.body;
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

    setParams (params: Record<string, string>) {
        this._params = params;
    }


}