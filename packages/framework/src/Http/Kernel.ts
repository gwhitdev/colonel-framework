import { HttpRequest } from './HttpRequest';
import { Router } from './Router';
import type { HttpMethod } from './types/HttpMethod';
import { join, resolve } from 'node:path';
import ejs from 'ejs';
import type { RouteHandler } from './types/RouteHandler';
import { Container } from '../Container/Container';
import { InMemorySessionStore, Session, type SessionStore } from './Session';


type ControllerClass = new (...args: any[]) => object;
type ControllerResolver = (name: string) => Promise<ControllerClass>;

interface KernelOptions {
    controllerResolver?: ControllerResolver;
    viewsRoot?: string;
    session?: {
        enabled?: boolean;
        cookieName?: string;
        ttlSeconds?: number;
        store?: SessionStore;
    };
}

type ViewPayload = [
    template: string,
    data?: Record<string, any>,
    layout?: string | null,
    footerPartial?: string,
    titlePartial?: string
];

const isViewPayload = (value: any): value is ViewPayload => {
    if (!Array.isArray(value)) return false;
    if (typeof value[0] !== "string") return false;
    if (value[1] !== undefined && (typeof value[1] !== "object" || value[1] === null)) return false;
    if (value[2] !== undefined && typeof value[2] !== "string" && value[2] !== null) return false;
    if (value[3] !== undefined && typeof value[3] !== "string") return false;
    if (value[4] !== undefined && typeof value[4] !== "string") return false;
    return true;
};

const safeViewPath = (view: string) => view.replace(/\.\./g, '').replace(/\/+/g, '/');

type SessionContext = {
    session: Session;
    cookieName: string;
    ttlSeconds: number;
};

const parseCookies = (headerValue: string | null): Record<string, string> => {
    if (!headerValue) {
        return {};
    }

    return headerValue
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, chunk) => {
            const [name, ...rest] = chunk.split('=');
            if (!name || rest.length === 0) {
                return acc;
            }

            acc[name] = decodeURIComponent(rest.join('='));
            return acc;
        }, {});
};

const createSessionId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export class Kernel {
    private readonly defaultSessionStore = new InMemorySessionStore();

    constructor(
        private router = new Router(),
        private middleware: Array<Function> = [],
        private options: KernelOptions = {},
        private container: Container,
    ) {}

    private async resolveController(name: string): Promise<ControllerClass> {
        if (!this.options.controllerResolver) {
            throw new Error(`No controller resolver configured for handler ${name}`);
        }

        return this.options.controllerResolver(name);
    }

    private viewRoot(): string {
        return this.options.viewsRoot ?? join(resolve(), "resources", "views");
    }

    /**
     * Main entrypoint for every HTTP request.
     */
    async handle(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const sessionContext = await this.initializeSession(request.headers);
        const httpRequest = new HttpRequest({
            method: request.method,
            url: url,
            headers: request.headers,
            query: url.searchParams,
            body: await request.json().catch(() => null),
            session: sessionContext?.session,
        });

        try {
            // Run middleware pipeline
            const response = await this.runMiddlewarePipeline(httpRequest, async () => {
                return this.dispatchToRouter(httpRequest)
            });

            const normalizedResponse = await this.normalizeResponse(response);
            return await this.commitSession(normalizedResponse, sessionContext);
        } catch (error) {
            console.error(error);
            return this.handleException("Middleware couldn't process the request", 500);
        }
    }

    private async initializeSession(headers: Headers): Promise<SessionContext | null> {
        const sessionOptions = this.options.session;
        if (!sessionOptions?.enabled) {
            return null;
        }

        const cookieName = sessionOptions.cookieName ?? 'colonel.sid';
        const ttlSeconds = sessionOptions.ttlSeconds ?? 60 * 60 * 24 * 7;
        const store = sessionOptions.store ?? this.defaultSessionStore;

        const cookieMap = parseCookies(headers.get('cookie'));
        const incomingSessionId = cookieMap[cookieName];

        if (incomingSessionId) {
            const existingPayload = await store.get(incomingSessionId);
            if (existingPayload) {
                return {
                    session: new Session(incomingSessionId, existingPayload, store, ttlSeconds, false),
                    cookieName,
                    ttlSeconds,
                };
            }
        }

        return {
            session: new Session(createSessionId(), {}, store, ttlSeconds, true),
            cookieName,
            ttlSeconds,
        };
    }

    private async commitSession(response: Response, sessionContext: SessionContext | null): Promise<Response> {
        if (!sessionContext) {
            return response;
        }

        const { session, cookieName, ttlSeconds } = sessionContext;
        await session.persist();

        if (!session.shouldCommit()) {
            return response;
        }

        const setCookieValue = session.isInvalidated()
            ? `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
            : `${cookieName}=${encodeURIComponent(session.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}`;

        const headers = new Headers(response.headers);
        headers.append('Set-Cookie', setCookieValue);

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
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

        // Allows functional routes
        if (typeof route.handler === "function") {
            return route.handler(req);
        }

        const handler = route.handler as RouteHandler;

        if (typeof handler !== "string") {
            return new Response("Invalid route handler type", { status: 500 });
        }

        const parts: string[] = handler.split("@");

        if (parts.length !== 2) {
            return new Response("Invalid route handler format", { status: 500 });
        }

        const [controllerName, method] = parts;

        const ImportedControllerClass = await this.resolveController(controllerName!);

        const controllerInstance = this.container.make(ImportedControllerClass);

        const action = (controllerInstance as any)[method!] as (req: HttpRequest) => Promise<Response> | Response;

        if (typeof action !== "function") return new Response("Action not found", { status: 500 });

        const result = await action.call(controllerInstance, req);

        return result;
    }

    /**
     * Convert controller output into a proper Response
     */
    private async normalizeResponse(result: any): Promise<Response> {
        if (result instanceof Response) return result;

        if (isViewPayload(result)) {
            const [
                template,
                data = {},
                layout = "base/layouts/main",
                footerPartial = "base/partials/footer",
                titlePartial = "base/partials/title",
            ] = result;

            const safeTemplate = safeViewPath(template);
            
            // Inject env appName into titleData if available
            process.env.appName ? data.titleData = `${data.titleData} | ${process.env.appName}`: null; 

            try {
                const childPath = join(this.viewRoot(), `${safeTemplate}.ejs`);
                const bodyHtml = await ejs.renderFile(childPath, data || {});

                // Wrap in layout if provided
                if (layout) {
                    const returnPath = async (path: string): Promise<string> => 
                        join(this.viewRoot(), `${safeViewPath(path)}.ejs`);
                    
                    const [layoutPath, footerPath, titlePath] = await Promise.all([
                        returnPath(layout),
                        returnPath(footerPartial),
                        returnPath(titlePartial)
                    ]);

                    console.info(`Rendering layout: ${layoutPath}`);

                    const [bodyHtml, footerHtml, titleHtml] = await Promise.all([
                        ejs.renderFile(childPath, data || {}),
                        ejs.renderFile(footerPath, {
                            footerData:(data as any).footerData 
                            || ''
                        }),
                        ejs.renderFile(titlePath, {
                            titleData: (data as any).titleData
                            || ''
                        })
                    ]);

                    console.info(`Rendering view: ${childPath}`);

                    const finalHtml = await ejs.renderFile(layoutPath, { 
                        ...(data ?? {}), 
                        body: bodyHtml,
                        footer: footerHtml,
                        title: titleHtml
                    });

                    return new Response(finalHtml, {
                        headers: { "Content-Type": "text/html; charset=utf-8" }
                    });
                }

                // No layout, return child as-is
                return new Response(bodyHtml, {
                    headers: { "Content-Type": "text/html; charset=utf-8" }
                });
            } catch (err) {
                console.error(err);
                return this.handleException("Error rendering value", 500)
            }
        }

        if (typeof result === "object" && result !== null) {
            return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(String(result ?? ""), { status: 200 });
    }

    /** 
     * Centralized error handling
     */
    private handleException(error: any, code: number): Response {
        console.error(error);
        const errorString = error ?? "Internal Server Error";
        return new Response(errorString, { 
            status: code 
        });
    }
}