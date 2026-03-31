import type { HttpRequest } from "../../../framework/Http/HttpRequest";

export class UserController {
    index() {
        return new Response(JSON.stringify({ message: "Hello from UserController@index" }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    show(req: HttpRequest) {
        const id = req.params("id");
        return new Response(JSON.stringify({ message: `Hello from UserController@show with id ${id}` }), {
            headers: { "Content-Type": "application/json" }
        });
    }
}   