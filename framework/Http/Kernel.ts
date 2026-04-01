import Controller from '../../app/Http/Controllers/Controller';
import { HttpRequest } from './HttpRequest';
import { Router } from './Router';
//import { Container } from '../Container/Container';
import type { HttpMethod } from './types/HttpMethod';
import { join, resolve } from 'node:path';
import ejs from 'ejs';

export class Kernel {
    constructor(
        private router = new Router(),
        //private container = new Container(),
        private middleware: Array<Function> = []
    ) {}

    /**
     * Main entrypoint for every HTTP request.
     */
    async handle(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const httpRequest = new HttpRequest({
            method: request.method,
            url: url,
            headers: request.headers,
            query: url.searchParams,
            body: await request.json().catch(() => null)
        });

        try {
            // Run middleware pipeline
            const response = await this.runMiddlewarePipeline(httpRequest, async () => {
                return this.dispatchToRouter(httpRequest)
            });

            return this.normalizeResponse(response);
        } catch (error) {
            return this.handleException(error);
        }
    }

    /**
     * Run middleware in sequence
     */
    private async runMiddlewarePipeline(req: HttpRequest, finalHandler: Function) {
        let index = -1;

        const runner = async (i: number): Promise<Response> => {
            if (i <= index) throw new Error("next() called multiple times");
            index = i;

            const middleware = this.middleware[i];
            if (!middleware) return finalHandler(req);

            return middleware(req, () => runner(i + 1));
        }

        return runner(0);
    }

    /** 
     * Ask the router to resolve the route and call the controller
     */
    private async dispatchToRouter(req: HttpRequest) {

        const route = this.router.match(req.method as HttpMethod, req.path());

        if (!route) return new Response("Not Found", { status: 404 });
        
        req.setParams(route.params);

        const parts: string[] = route.handler.split("@");

        if (parts.length !== 2) {
            return new Response("Invalid route handler format", { status: 500 });
        }

        const [controllerName, method] = parts;

        const controllerPath = (name: string) => `../../app/Http/Controllers/${name}.ts`;

        const ImportedControllerClass = await import(controllerPath(controllerName!))
            .then(m => m[controllerName!] as typeof Controller);

        const controllerInstance = new ImportedControllerClass();

        const action = (controllerInstance as any)[method!] as (req: HttpRequest) => Promise<Response> | Response;

        if (typeof action !== "function") return new Response("Action not found", { status: 500 });

        const result = await action.call(controllerInstance, req);

        return result;
    }

    /**
     * Convert controller output into a proper Response
     */
    private normalizeResponse(result: any): Promise<Response> | Response {
        if (result instanceof Response) return result;

        if (Array.isArray(result) && result[0].split("/").length === 2 && typeof result[0] === "string") {
            return ejs.renderFile(
                join(resolve(), "resources", "views",`${result[0]!}.ejs`),
                (result[1] as Record<string, string>) || { data: {} })

                .then(html => new Response(html, {
                    headers: { "Content-Type": "text/html" }
                }))

                .catch(err => {
                    console.error(err);
                    return new Response("Error rendering view", { status: 500 });
                });
        }

        if (typeof result === "object") {
            return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" }
            });
        }
       

        return new Response("Bad Request", { status: 400 });
    }

    /** 
     * Centralized error handling
     */
    private handleException(error: any): Response {
        console.error(error);

        return new Response("Internal Server Error", { 
            status: 500 
        });
    }
}