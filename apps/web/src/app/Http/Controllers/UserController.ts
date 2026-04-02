import type { HttpRequest } from "@colonel/framework/Http/HttpRequest";
import Controller from "./Controller";


export class UserController extends Controller {
    index(): Array<string | Record<string, any>> {
        return [
            'users/index',
            { users: [{ id: 1, name: "John Doe" }, { id: 2, name: "Jane Doe" }] }
        ]}

    show(req: HttpRequest): Record<string, string> {
        const id = req.params("id");
       
        return {
            "message": `Hello from UserController@show with id ${id}`
        }
    }
}   