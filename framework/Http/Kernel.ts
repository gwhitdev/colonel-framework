import { HttpRequest } from './HttpRequest';
import { Router } from './Router';
//import { Container } from '../Container/Container';
import type { HttpMethod } from './types/HttpMethod';

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
        console.log("Dispatching request", { method: req.method, path: req.path() });
        const route = this.router.match(req.method as HttpMethod, req.path());

        if (!route) return new Response("Not Found", { status: 404 });
        
        req.setParams(route.params);

        const parts: string[] = route.handler.split("@");
        if (parts.length !== 2) {
            return new Response("Invalid route handler format", { status: 500 });
        }
        const [controllerName, method] = parts;

        const ImportedControllerClass = await import(`../../app/Http/Controllers/${controllerName}.ts`)
        .then(m => m[controllerName!]);

        const controllerInstance = new ImportedControllerClass();

        const action = controllerInstance[method!];

        if (typeof action !== "function") return new Response("Method not found", { status: 500 });

        const result = await action.call(controllerInstance, req);

        return result;
    }

    /**
     * Convert controller output into a proper Response
     */
    private normalizeResponse(result: any): Response {
        if (result instanceof Response) return result;

        if (typeof result === "object") {
            return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(String(result));
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