export const redirect = (
        to: string ,
    status: 301 | 302 | 303 | 307 | 308 = 302): Response => {
        console.info(`Redirecting to ${to} with status ${status}`)
        return new Response(null, {
            status,
            headers: {
                "Location": to
            },
        });
    };