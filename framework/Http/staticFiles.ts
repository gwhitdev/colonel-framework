/**
 * Determines if the given pathname matches any of the configured static paths.
 * @param pathname 
 * @param staticPaths 
 * @returns boolean
 */
export function isStaticPath(pathname: string, staticPaths: string[]): boolean {
    console.info(`Checking if path is static: ${pathname}`);
    console.info(`Static paths: ${staticPaths.join(", ")}`);
    return staticPaths.some(staticPath => pathname.startsWith(staticPath));
}

/**
 * Defines the file system path for a given URL pathname, ensuring it maps to the public directory.
 * @param pathname 
 * @param join 
 * @returns string
 */
export function toPublicFilePath(pathname: string, join: Function): string {
    const publicRoot = join(process.cwd(), "public");
    const safePath = pathname.replace(/^\/(static|assets|public)\//, "");
    console.log(`Mapping URL path "${pathname}" to file system path "${safePath}"`);
    return join(publicRoot, safePath);
}

/**
 * Determines the content type for a given file path based on its extension.
 * @param pathname 
 * @param exts 
 * @param extname 
 * @returns string
 */
export function contentTypeFor(pathname: string, exts: Record<string, string>, extname: Function): string {
    const ext = extname(pathname).split('.').pop()?.toLowerCase() || '';

    console.info(`Determining content type for extension: ${ext}`);

    if (exts[ext]) {
        console.info(`Matched content type: ${exts[ext]}`);
        return exts[ext];
    }

    console.warn(`No content type found for extension: ${ext}`);
    
    return "application/octet-stream";
}