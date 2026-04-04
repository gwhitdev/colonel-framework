import { badRequest, type HttpRequest } from "@coloneldev/framework";

export async function requireJsonForWrites(req: HttpRequest, next: () => Promise<unknown>): Promise<unknown> {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && !req.isJson()) {
        return badRequest("Write requests must use application/json", {
            hint: "Set Content-Type: application/json",
        });
    }

    return next();
}