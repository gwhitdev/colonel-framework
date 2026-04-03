import { describe, expect, it } from "bun:test";
import { Router } from "./Router";

describe("Router group", () => {
    it("prefixes grouped routes", () => {
        const router = new Router();

        router.group("/users", (grouped) => {
            grouped.get("/", "UserController@index");
            grouped.get("/:id", "UserController@show");
        });

        const indexMatch = router.match("GET", "/users");
        const showMatch = router.match("GET", "/users/42");

        expect(indexMatch?.handler).toBe("UserController@index");
        expect(showMatch?.handler).toBe("UserController@show");
        expect(showMatch?.params.id).toBe("42");
    });

    it("supports nested groups", () => {
        const router = new Router();

        router.group("/api", (api) => {
            api.group("/v1", (v1) => {
                v1.get("/health", () => new Response("ok"));
            });
        });

        const match = router.match("GET", "/api/v1/health");
        expect(match).not.toBeNull();
    });
});
