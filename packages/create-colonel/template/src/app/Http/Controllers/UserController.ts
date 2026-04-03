import type { HttpRequest } from "@coloneldev/framework";
import Controller from "./Controller";


export class UserController extends Controller {
    index(): Array<string | Record<string, any>> {
        return [
            'users/index',
            {
                users: [
                    { id: 1, name: "John Doe", email: "john@example.com" },
                    { id: 2, name: "Jane Doe", email: "jane@example.com" }
                ]
            }
        ]}

    show(req: HttpRequest): Array<string | Record<string, any>> {
        const id = req.params("id");
       
        return [
            'users/show',
            {
                user: {
                    id,
                    name: `User ${id}`,
                    email: `user${id}@example.com`
                }
            }
        ]
    }
}   