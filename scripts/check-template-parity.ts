import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");

const parityPairs: Array<[string, string]> = [
    [
        "examples/web/src/bootstrap/server.ts",
        "packages/create-colonel/template/src/bootstrap/server.ts",
    ],
    [
        "examples/web/src/config/routes/web.ts",
        "packages/create-colonel/template/src/config/routes/web.ts",
    ],
    [
        "examples/web/src/app/Http/Controllers/Controller.ts",
        "packages/create-colonel/template/src/app/Http/Controllers/Controller.ts",
    ],
    [
        "examples/web/src/app/Http/Controllers/UserController.ts",
        "packages/create-colonel/template/src/app/Http/Controllers/UserController.ts",
    ],
    [
        "examples/web/src/app/Http/Middleware/RequireJsonForWrites.ts",
        "packages/create-colonel/template/src/app/Http/Middleware/RequireJsonForWrites.ts",
    ],
    [
        "examples/web/src/app/Http/Middleware/TraceHeader.ts",
        "packages/create-colonel/template/src/app/Http/Middleware/TraceHeader.ts",
    ],
    [
        "examples/web/resources/views/base/layouts/main.ejs",
        "packages/create-colonel/template/resources/views/base/layouts/main.ejs",
    ],
    [
        "examples/web/resources/views/base/partials/footer.ejs",
        "packages/create-colonel/template/resources/views/base/partials/footer.ejs",
    ],
    [
        "examples/web/resources/views/users/index.ejs",
        "packages/create-colonel/template/resources/views/users/index.ejs",
    ],
    [
        "examples/web/resources/views/users/show.ejs",
        "packages/create-colonel/template/resources/views/users/show.ejs",
    ],
];

const normalize = (value: string): string => value.replace(/\r\n/g, "\n").trimEnd();

const mismatches: Array<{ left: string; right: string }> = [];

for (const [left, right] of parityPairs) {
    const leftPath = resolve(repoRoot, left);
    const rightPath = resolve(repoRoot, right);
    const leftContent = normalize(readFileSync(leftPath, "utf8"));
    const rightContent = normalize(readFileSync(rightPath, "utf8"));

    if (leftContent !== rightContent) {
        mismatches.push({ left, right });
    }
}

if (mismatches.length > 0) {
    console.error("Template parity check failed. The following file pairs diverged:");
    for (const pair of mismatches) {
        console.error(`- ${pair.left} <> ${pair.right}`);
    }
    process.exit(1);
}

console.log("Template parity check passed.");