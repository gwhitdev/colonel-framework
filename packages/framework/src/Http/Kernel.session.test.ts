import { describe, expect, it } from "bun:test";
import { Container } from "../Container/Container";
import { Kernel } from "./Kernel";
import { Router } from "./Router";

describe("Kernel session integration", () => {
    it("creates a session cookie and persists session state across requests", async () => {
        const router = new Router();
        router.get("/", (req) => {
            const previous = req.session?.get<number>("visits") ?? 0;
            const visits = previous + 1;
            req.session?.set("visits", visits);

            return new Response(JSON.stringify({ visits }), {
                headers: { "Content-Type": "application/json" },
            });
        });

        const kernel = new Kernel(
            router,
            [],
            {
                session: {
                    enabled: true,
                    cookieName: "test.sid",
                },
            },
            new Container()
        );

        const firstResponse = await kernel.handle(new Request("http://localhost/"));
        const firstBody = await firstResponse.json();
        const setCookie = firstResponse.headers.get("set-cookie");

        expect(firstBody).toEqual({ visits: 1 });
        expect(setCookie).toContain("test.sid=");

        const cookiePair = setCookie?.split(";")[0] ?? "";
        const secondResponse = await kernel.handle(
            new Request("http://localhost/", {
                headers: { cookie: cookiePair },
            })
        );
        const secondBody = await secondResponse.json();

        expect(secondBody).toEqual({ visits: 2 });
    });
});
