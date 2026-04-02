#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const targetArg = process.argv[2];

if (!targetArg) {
    console.error("Usage: bun create colonel <project-name>");
    process.exit(1);
}

const targetDir = resolve(process.cwd(), targetArg);
const templateDir = resolve(import.meta.dir, "..", "template");

if (existsSync(targetDir)) {
    const hasFiles = readdirSync(targetDir).length > 0;
    if (hasFiles) {
        console.error(`Target directory is not empty: ${targetDir}`);
        process.exit(1);
    }
} else {
    mkdirSync(targetDir, { recursive: true });
}

cpSync(templateDir, targetDir, { recursive: true });

const packageJsonPath = resolve(targetDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
packageJson.name = basename(targetDir);

const localFrameworkPath = resolve(import.meta.dir, "..", "..", "framework");
if (existsSync(resolve(localFrameworkPath, "package.json"))) {
    packageJson.dependencies["@coloneldev/framework"] = `file:${localFrameworkPath}`;
}

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log("Installing dependencies...");
const install = Bun.spawnSync(["bun", "install"], {
    cwd: targetDir,
    stdout: "inherit",
    stderr: "inherit",
});

if (install.exitCode !== 0) {
    console.error("Project was created, but dependency installation failed.");
    process.exit(install.exitCode);
}

console.log("\nColonel app created successfully.\n");
console.log(`  cd ${targetArg}`);
console.log("  bun run start\n");
