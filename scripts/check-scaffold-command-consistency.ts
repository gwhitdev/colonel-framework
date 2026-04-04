import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");

const filesToValidate = [
    "README.md",
    "docs/getting-started.md",
    "docs/cli-and-template.md",
    "packages/create-colonel/README.md",
    "packages/create-colonel/src/cli.ts",
];

const forbiddenPatterns: RegExp[] = [
    /bun create colonel/i,
    /npx create-colonel/i,
    /npm create colonel@latest/i,
];

const requiredPatternsByFile: Record<string, RegExp[]> = {
    "README.md": [/bunx create-colonel my-app/],
    "docs/getting-started.md": [/bunx create-colonel my-app/],
    "docs/cli-and-template.md": [/bunx create-colonel my-app/],
    "packages/create-colonel/README.md": [/bunx create-colonel my-app/],
    "packages/create-colonel/src/cli.ts": [/Usage: bunx create-colonel <project-name>/],
};

const failures: string[] = [];

for (const relativePath of filesToValidate) {
    const content = readFileSync(resolve(repoRoot, relativePath), "utf8");

    for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
            failures.push(`${relativePath} contains forbidden scaffold command pattern: ${pattern}`);
        }
    }

    const requiredPatterns = requiredPatternsByFile[relativePath] ?? [];
    for (const pattern of requiredPatterns) {
        if (!pattern.test(content)) {
            failures.push(`${relativePath} missing required scaffold command pattern: ${pattern}`);
        }
    }
}

if (failures.length > 0) {
    console.error("Scaffold command consistency check failed:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Scaffold command consistency check passed.");