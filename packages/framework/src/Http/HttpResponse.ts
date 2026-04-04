type HeaderInit = Headers | Record<string, string> | Array<[string, string]>;

const withHeader = (headers: HeaderInit | undefined, name: string, value: string): Headers => {
    const next = new Headers(headers);
    if (!next.has(name)) {
        next.set(name, value);
    }

    return next;
};

export const text = (
    body: string,
    status = 200,
    headers?: HeaderInit
): Response => {
    return new Response(body, {
        status,
        headers: withHeader(headers, "Content-Type", "text/plain; charset=utf-8"),
    });
};

export const html = (
    body: string,
    status = 200,
    headers?: HeaderInit
): Response => {
    return new Response(body, {
        status,
        headers: withHeader(headers, "Content-Type", "text/html; charset=utf-8"),
    });
};

export const json = <T>(
    payload: T,
    status = 200,
    headers?: HeaderInit
): Response => {
    return new Response(JSON.stringify(payload), {
        status,
        headers: withHeader(headers, "Content-Type", "application/json; charset=utf-8"),
    });
};

export const badRequest = (message = "Bad Request", details?: unknown): Response => {
    return json({ error: { status: 400, message, details } }, 400);
};

export const notFound = (message = "Not Found", details?: unknown): Response => {
    return json({ error: { status: 404, message, details } }, 404);
};

export const unprocessableEntity = (message = "Validation failed", details?: unknown): Response => {
    return json({ error: { status: 422, message, details } }, 422);
};

export const internalServerError = (message = "Internal Server Error", details?: unknown): Response => {
    return json({ error: { status: 500, message, details } }, 500);
};

export const redirect = (
        to: string,
    status: 301 | 302 | 303 | 307 | 308 = 302): Response => {
        console.info(`Redirecting to ${to} with status ${status}`);
        return new Response(null, {
            status,
            headers: {
                "Location": to
            },
        });
    };