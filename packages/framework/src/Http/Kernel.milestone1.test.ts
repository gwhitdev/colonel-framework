import { describe, expect, it } from "bun:test";
import { Container } from "../Container/Container";
import { Kernel } from "./Kernel";
import { Router } from "./Router";

describe("Kernel milestone 1", () => {
    it("runs middleware in order and allows short-circuit responses", async () => {
        const router = new Router();
        router.get("/", () => new Response("handler"));

        const calls: string[] = [];

        const kernel = new Kernel(
            router,
            [
                async (_req, next) => {
                    calls.push("first:before");
                    const response = await next();
                    calls.push("first:after");
                    return response;
                },
                async (_req, _next) => {
                    calls.push("second:short");
                    return new Response("blocked", { status: 401 });
                },
            ],
            {},
            new Container()
        );

        const response = await kernel.handle(new Request("http://localhost/"));

        expect(response.status).toBe(401);
        expect(await response.text()).toBe("blocked");
        expect(calls).toEqual(["first:before", "second:short", "first:after"]);
    });

    it("returns 422 with validation details for invalid payloads", async () => {
        const router = new Router();
        router.post("/users", (req) => {
            req.validate({
                name: { required: true, type: "string", minLength: 2 },
                email: { required: true, pattern: /^[^@]+@[^@]+\.[^@]+$/ },
            });

            return { ok: true };
        });

        const kernel = new Kernel(router, [], {}, new Container());

        const response = await kernel.handle(new Request("http://localhost/users", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "accept": "application/json",
            },
            body: JSON.stringify({ name: "", email: "not-an-email" }),
        }));

        const body = await response.json();

        expect(response.status).toBe(422);
        expect(body).toEqual({
            error: {
                status: 422,
                message: "Validation failed",
                details: {
                    errors: {
                        name: ["name is required"],
                        email: ["email format is invalid"],
                    },
                },
            },
        });
    });

    it("returns standardized JSON errors for not found and controller exceptions", async () => {
        const router = new Router();
        router.get("/boom", "BoomController@index");

        class BoomController {
            index(): never {
                throw new Error("controller exploded");
            }
        }

        const kernel = new Kernel(
            router,
            [],
            {
                controllerResolver: async () => BoomController,
            },
            new Container()
        );

        const notFound = await kernel.handle(new Request("http://localhost/missing", {
            headers: { accept: "application/json" },
        }));
        const notFoundBody = await notFound.json();

        expect(notFound.status).toBe(404);
        expect(notFoundBody).toEqual({
            error: {
                status: 404,
                message: "Not Found",
                details: undefined,
            },
        });

        const boom = await kernel.handle(new Request("http://localhost/boom", {
            headers: { accept: "application/json" },
        }));
        const boomBody = await boom.json();

        expect(boom.status).toBe(500);
        expect(boomBody).toEqual({
            error: {
                status: 500,
                message: "Internal Server Error",
                details: {
                    message: "controller exploded",
                },
            },
        });
    });
});