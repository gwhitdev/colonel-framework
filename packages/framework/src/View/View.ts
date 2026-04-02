export default class View {
    static render(template: string, data: Record<string, any>): Promise<Response> {
        return new Promise<Response>((resolve) => {
            resolve(new Response(JSON.stringify({ template, data }), {
                headers: { "Content-Type": "application/json" }
            }));
        });
    }
}