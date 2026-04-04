import { afterEach, describe, expect, it } from "bun:test";
import { Container } from "../Container/Container";
import { Kernel } from "./Kernel";
import { Router } from "./Router";

describe("Kernel diagnostics", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    it("returns startup diagnostics for invalid route handler format", async () => {
        process.env.NODE_ENV = "test";

        const router = new Router();
        router.get("/", "InvalidHandlerFormat");

        const kernel = new Kernel(router, [], {}, new Container());
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
                    route: "GET /",
                    handler: "InvalidHandlerFormat",
                    expected: "Controller@method",
                },
            },
        });
    });

    it("returns startup diagnostics when controller cannot be resolved", async () => {
        process.env.NODE_ENV = "test";

        const router = new Router();
        router.get("/", "MissingController@index");

        const kernel = new Kernel(
            router,
            [],
            {
                controllerResolver: async () => {
                    throw new Error("Module not found");
                },
            },
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
                    controller: "MissingController",
                    reason: "Module not found",
                },
            },
        });
    });
});