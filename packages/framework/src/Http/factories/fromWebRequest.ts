import { HttpRequest } from "../HttpRequest";

export async function fromWebRequest(req: Request): Promise<HttpRequest> {
    const url = new URL (req.url);

    let body: unknown = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        body = await req.json().catch(() => null);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
    }

    return new HttpRequest({
        method: req.method,
        url: url,
        headers: req.headers,
        query: url.searchParams,
        body,
    });
}