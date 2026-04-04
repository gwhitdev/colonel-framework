import { json, type HttpRequest } from "@coloneldev/framework";
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

    create(req: HttpRequest): Response {
        const payload = req.validate({
            name: { required: true, type: "string", minLength: 2, maxLength: 80 },
            email: {
                required: true,
                type: "string",
                pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
            },
        });

        return json({
            message: "User payload accepted",
            user: {
                name: payload.name,
                email: payload.email,
            },
        }, 201);
    }
}   