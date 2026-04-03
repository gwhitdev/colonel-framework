import type { HttpRequest, Session } from "@coloneldev/framework";

export default class Controller {
    constructor() {
        // Base constructor logic can be added here if needed
    }
    // Base controller logic can be added here, such as common response formatting, error handling, etc.
    health(): Record<string, string> {
        return { status: "ok" };
    }

    protected requireSession(req: HttpRequest): Session {
        if (!req.session) {
            throw new Error("Session is not enabled for this request");
        }

        return req.session;
    }

    protected sessionGet<T = unknown>(req: HttpRequest, key: string): T | undefined {
        return this.requireSession(req).get<T>(key);
    }

    protected sessionPut(req: HttpRequest, key: string, value: unknown): void {
        this.requireSession(req).set(key, value);
    }

    protected sessionForget(req: HttpRequest, key: string): void {
        this.requireSession(req).forget(key);
    }
}