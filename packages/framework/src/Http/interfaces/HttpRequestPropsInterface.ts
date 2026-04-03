import type { Session } from "../Session";

export interface HttpRequestProps {
    method: string;
    url: URL;
    headers: Headers;
    query: URLSearchParams;
    body: unknown;
    session?: Session;
}