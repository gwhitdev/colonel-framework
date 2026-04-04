import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type PackageJson = {
    version?: string;
    dependencies?: Record<string, string>;
};

const repoRoot = resolve(import.meta.dir, "..");

const readJson = <T>(filePath: string): T => {
    return JSON.parse(readFileSync(resolve(repoRoot, filePath), "utf8")) as T;
};

const frameworkPkg = readJson<PackageJson>("packages/framework/package.json");
const templatePkg = readJson<PackageJson>("packages/create-colonel/template/package.json");
const createPkg = readJson<PackageJson>("packages/create-colonel/package.json");

const failures: string[] = [];

if (!frameworkPkg.version) {
    failures.push("packages/framework/package.json is missing version");
}

if (!createPkg.version) {
    failures.push("packages/create-colonel/package.json is missing version");
}

const expectedFrameworkRange = frameworkPkg.version ? `^${frameworkPkg.version}` : null;
const templateFrameworkRange = templatePkg.dependencies?.["@coloneldev/framework"];

if (!templateFrameworkRange) {
    failures.push("packages/create-colonel/template/package.json is missing @coloneldev/framework dependency");
} else if (expectedFrameworkRange && templateFrameworkRange !== expectedFrameworkRange) {
    failures.push(
        `template framework dependency mismatch: expected ${expectedFrameworkRange}, found ${templateFrameworkRange}`
    );
}

if (failures.length > 0) {
    console.error("Version alignment check failed:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Version alignment check passed.");