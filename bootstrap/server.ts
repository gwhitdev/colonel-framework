import { Kernel } from "../framework/Http/Kernel";
import webRouter  from "../routes/web";
import { existsSync } from "fs";
import { extensions } from "../config/acceptedStaticContentTypes";
import { isStaticPath, contentTypeFor, toPublicFilePath } from "../framework/Http/staticFiles";
import { staticPaths } from "../config/staticPaths";
import { extname, join } from "path";

export const server = () => {
    const app = new Kernel(webRouter);

    const instance = Bun.serve({
        port: process.env.PORT || 5000,

        fetch: async (request) => {
            const url = new URL(request.url);
            console.info(`Received ${request.method} request for ${url.pathname}`);

            if (isStaticPath(url.pathname, staticPaths)) {
                const filePath = toPublicFilePath(url.pathname, join);

                if (!existsSync(filePath)) {
                    console.warn(`Static file not found: ${filePath}`);
                    return new Response("Not Found", { status: 404 });
                }

                console.info(`Serving static file: ${filePath}`);
                const headers: Record<string, string> = {};
                const ct = contentTypeFor(url.pathname, extensions, extname);
                if (ct) headers["Content-Type"] = ct;
                headers["Cache-Control"] = "public, max-age=31536000, immutable";

                return new Response(await Bun.file(filePath), { headers });
            }
            return app.handle(request);
        }
    });

    console.log(`Server running at http://localhost:${instance.port}/`);

    return instance;
};