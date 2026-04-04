import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const indexFile = resolve(repoRoot, "packages/framework/src/index.ts");

const expectedExports = [
    'export * from "./Http/Kernel";',
    'export * from "./Http/Router";',
    'export * from "./Http/HttpRequest";',
    'export * from "./Http/HttpResponse";',
    'export * from "./Http/errors";',
    'export * from "./Http/staticFiles";',
    'export * from "./Http/Session";',
    'export * from "./Container/Container";',
];

const content = readFileSync(indexFile, "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const mismatches: string[] = [];

if (content.length !== expectedExports.length) {
    mismatches.push(`Expected ${expectedExports.length} export lines, found ${content.length}`);
}

for (const expectedLine of expectedExports) {
    if (!content.includes(expectedLine)) {
        mismatches.push(`Missing export line: ${expectedLine}`);
    }
}

for (const actualLine of content) {
    if (!expectedExports.includes(actualLine)) {
        mismatches.push(`Unexpected export line: ${actualLine}`);
    }
}

if (mismatches.length > 0) {
    console.error("Public API surface check failed:");
    for (const mismatch of mismatches) {
        console.error(`- ${mismatch}`);
    }
    process.exit(1);
}

console.log("Public API surface check passed.");