import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { Container } from "../Container/Container";
import { Kernel } from "./Kernel";
import { Router } from "./Router";

describe("Kernel view integration", () => {
    it("renders a view payload using layout and partials", async () => {
        const root = mkdtempSync(join(tmpdir(), "colonel-views-"));

        try {
            const write = (file: string, contents: string) => {
                const fullPath = join(root, `${file}.ejs`);
                mkdirSync(dirname(fullPath), { recursive: true });
                writeFileSync(fullPath, contents);
            };

            write("base/layouts/main", "<html><body><header><%- title %></header><%- body %><footer><%- footer %></footer></body></html>");
            write("base/partials/title", "<title><%= titleData %></title>");
            write("base/partials/footer", "<p><%= footerData %></p>");
            write("home/index", "<h1>Hello <%= name %></h1>");

            const router = new Router();
            router.get("/", () => [
                "home/index",
                {
                    name: "Colonel",
                    titleData: "Welcome",
                    footerData: "Footer",
                },
            ]);

            const kernel = new Kernel(
                router,
                [],
                { viewsRoot: root },
                new Container()
            );

            const response = await kernel.handle(new Request("http://localhost/"));
            const html = await response.text();

            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toContain("text/html");
            expect(html).toContain("<h1>Hello Colonel</h1>");
            expect(html).toContain("<title>");
            expect(html).toContain("Footer");
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it("returns diagnostics when the target view file is missing", async () => {
        const root = mkdtempSync(join(tmpdir(), "colonel-views-missing-"));
        const originalNodeEnv = process.env.NODE_ENV;

        try {
            process.env.NODE_ENV = "test";

            const router = new Router();
            router.get("/", () => ["missing/template", {}]);

            const kernel = new Kernel(
                router,
                [],
                { viewsRoot: root },
                new Container()
            );

            const response = await kernel.handle(new Request("http://localhost/", {
                headers: { accept: "application/json" },
            }));
            const body = await response.json();

            expect(response.status).toBe(500);
            expect(body).toEqual({
                error: {
                    status: 500,
                    message: "Internal Server Error",
                    details: {
                        message: "View file not found",
                        status: 500,
                        details: {
                            view: "missing/template",
                            filePath: `${root}/missing/template.ejs`,
                        },
                    },
                },
            });
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
            rmSync(root, { recursive: true, force: true });
        }
    });
});