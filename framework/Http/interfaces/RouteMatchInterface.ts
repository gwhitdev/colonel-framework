import type { RouteHandler } from "../types/RouteHandler";

export interface RouteMatchInterface {
    handler: RouteHandler;
    params: Record<string, string>;
}