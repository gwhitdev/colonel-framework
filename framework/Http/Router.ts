import type { RouteDefinitionInterface } from './interfaces/RouteDefinitionInterface';
import type { RouteMatchInterface } from './interfaces/RouteMatchInterface';
import type { HttpMethod } from './types/HttpMethod';
import type { RouteHandler } from './types/RouteHandler';

export class Router {
    private routes: RouteDefinitionInterface[] = [];

    get(path: string, handler: RouteHandler) {
        this.add("GET", path, handler);
    }

    post(path: string, handler: RouteHandler) {
        this.add("POST", path, handler);
    }

    put(path: string, handler: RouteHandler) {
        this.add("PUT", path, handler);
    }

    delete(path: string, handler: RouteHandler) {
        this.add("DELETE", path, handler);
    }

    match(method: HttpMethod, requestPath: string): RouteMatchInterface | null {
        for (const route of this.routes) {
            if (route.method !== method) continue;

            const params = this.matchPath(route.path, requestPath);
            if (params) {
                return { handler: route.handler, params };
            }
        }
        return null;
    }

    add(method: HttpMethod, path: string, handler: RouteHandler): void {
        this.routes.push({ method, path, handler });
    }

    private matchPath(routePath: string, requestPath: string): Record<string, string> | null {
        const routeParts: string[] = routePath.split('/').filter(Boolean);
        const reqParts: string[] = requestPath.split('/').filter(Boolean);

        if (routeParts.length !== reqParts.length) return null;

        const params: Record<string, string> = {};

        if (routeParts.length === reqParts.length) {
            for (let i = 0; i < routeParts.length; i++) {
                const r: string = routeParts[i]!;
                const q: string = reqParts[i]!;

                if (r?.startsWith(":")) {
                    params[r.slice(1)] = q;
                } else if (r !== q) {
                    return null;
                }
            }
        }
        return params;
    }
}