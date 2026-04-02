import { describe, expect, it } from "bun:test";
import { Container } from "../Container/Container";
import { Kernel } from "./Kernel";
import { Router } from "./Router";

class MessageService {
    value(): string {
        return "resolved-via-container";
    }
}

class HomeController {
    static inject = [MessageService];

    constructor(private messageService: MessageService) {}

    index(): Record<string, string> {
        return { message: this.messageService.value() };
    }
}

describe("Kernel container integration", () => {
    it("resolves controller dependencies via static inject during request dispatch", async () => {
        const router = new Router();
        router.get("/", "HomeController@index");

        const container = new Container();
        container.singleton(MessageService, () => new MessageService());

        const kernel = new Kernel(
            router,
            [],
            {
                controllerResolver: async (name: string) => {
                    if (name !== "HomeController") {
                        throw new Error(`Unexpected controller: ${name}`);
                    }

                    return HomeController;
                },
            },
            container
        );

        const response = await kernel.handle(new Request("http://localhost/"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ message: "resolved-via-container" });
    });
});
