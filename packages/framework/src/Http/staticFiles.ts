/**
 * Determines if the given pathname matches any of the configured static paths.
 * @param pathname 
 * @param staticPaths 
 * @returns boolean
 */
export const isStaticPath =(pathname: string, staticPaths: string[]): boolean => 
    staticPaths.some((staticPath) => {
        // Directory-style static paths keep prefix matching (e.g. /assets/...).
        if (staticPath.endsWith("/")) {
            return pathname.startsWith(staticPath);
        }

        // File-style static paths must match exactly (e.g. /favicon.png).
        return pathname === staticPath;
    });

/**
 * Defines the file system path for a given URL pathname, ensuring it maps to the public directory.
 * @param pathname 
 * @param join 
 * @returns string
 */
export const toPublicFilePath = (pathname: string, path: {
    resolve: (...parts: string[]) => string;
    normalize: (p: string) => string;
    sep: string;
}, publicRootInput?: string): string => {
    const {  resolve, normalize, sep } = path;
    const publicRoot = publicRootInput ? resolve(publicRootInput) : resolve(process.cwd(), "public");

    const cleaned = normalize(
        pathname.replace(/^\/(static|assets|public)\//, "")
    );

    const resolved = resolve(publicRoot, "." + cleaned);
    const root = publicRoot.endsWith(sep) ? publicRoot : publicRoot + sep;

    if (resolved !== publicRoot && !resolved.startsWith(root)) {
        throw new Error("Invalid static file path");
    }
    return resolved;
}

/**
 * Determines the content type for a given file path based on its extension.
 * @param pathname 
 * @param exts 
 * @param extname 
 * @returns string
 */
export const contentTypeFor = (pathname: string, exts: Record<string, string>, extname: Function): string => {
    const ext = extname(pathname).split('.').pop()?.toLowerCase() || '';

    if (exts[ext]) {
        console.info(`Matched content type: ${exts[ext]}`);
        return exts[ext];
    }

    return "application/octet-stream";
}