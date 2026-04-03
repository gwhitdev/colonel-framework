import { Kernel } from "@coloneldev/framework";
import webRouter  from "../config/routes/web";
import { existsSync } from "fs";
import { extensions } from "../config/acceptedStaticContentTypes";
import { isStaticPath, contentTypeFor, toPublicFilePath } from "@coloneldev/framework";
import { staticPaths } from "../config/staticPaths";
import path, { extname } from "path";
import { Container } from "@coloneldev/framework";
import { AppInfoService } from "../app/Services/AppInfoService.ts";

const viewsRoot = path.resolve(import.meta.dir, "..", "..", "resources", "views");
const publicRoot = path.resolve(import.meta.dir, "..", "..", "public");
const controllerRoot = path.resolve(import.meta.dir, "..", "app", "Http", "Controllers");
const container = new Container();

container.singleton(AppInfoService, () => new AppInfoService(process.env.appName ?? "Colonel"));

export const server = () => {
    const Colonel = new Kernel(webRouter, [], {
        viewsRoot,
        controllerResolver: async (name: string) => {
            const modulePath = `${controllerRoot}/${name}.ts`;
            const mod = await import(modulePath);
            const controller = mod[name];

            if (!controller) {
                throw new Error(`Controller not found: ${name}`);
            }

            return controller;
        }
    }, container);
    const PORT = Number(process.env.PORT) || 5000;
    
    console.log(`Server running at http://localhost:${PORT}/`);

    const addHeadersForStaticFiles = (path:string) => {
        const headers: Record<string, string> = {};
        const ct = contentTypeFor(path, extensions, extname);

        if (ct) headers["Content-Type"] = ct;
        headers["Cache-Control"] = "public, max-age=31536000, immutable";
        return headers;
    };

    const createStaticResponseWithHeaders = (filePath: string) => {
            if (!existsSync(filePath)) {
                console.warn(`Static file not found: ${filePath}`);
                return new Response("Not Found", { status: 404 });
            }
            
            console.info(`Serving static file: ${filePath}`);

            const headers = addHeadersForStaticFiles(filePath);
            
            return new Response(Bun.file(filePath), { headers });
        };

    return Bun.serve({
        port: PORT,

        fetch: async (request) => {
            const url = new URL(request.url);

            console.info(`Received ${request.method} request for ${url.pathname}`);

            if (isStaticPath(url.pathname, staticPaths)) {
                let filePath: string;

                try {
                    filePath = toPublicFilePath(url.pathname, path, publicRoot);
                } catch {
                    console.warn(`Invalid static file path: ${url.pathname}`);
                    return new Response("Not Found", { status: 404 });
                }

                return createStaticResponseWithHeaders(filePath);
            }

            return Colonel.handle(request);
        }
    });
};