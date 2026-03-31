import { Kernel } from "../framework/Http/Kernel";
import webRouter  from "../routes/web";

export const server = () => {
    const app = new Kernel(webRouter);

    const instance = Bun.serve({
        port: 5000,
        fetch: (request) => {
            return app.handle(request);
        }
    });

    console.log(`Server running at http://localhost:${instance.port}/`);

    return instance;
};