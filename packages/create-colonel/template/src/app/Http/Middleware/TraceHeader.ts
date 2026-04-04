import type { HttpRequest } from "@coloneldev/framework";

export async function traceHeader(req: HttpRequest, next: () => Promise<unknown>): Promise<unknown> {
    const result = await next();

    if (!(result instanceof Response)) {
        return result;
    }

    const headers = new Headers(result.headers);
    headers.set("x-colonel-trace", `${req.method} ${req.path()}`);

    return new Response(result.body, {
        status: result.status,
        statusText: result.statusText,
        headers,
    });
}