#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const args = process.argv.slice(2);
const targetArg = args.find((arg) => !arg.startsWith("-"));
const skipInstall = args.includes("--skip-install");
const showHelp = args.includes("--help") || args.includes("-h");

if (showHelp) {
    console.log("Usage: bunx create-colonel <project-name> [--skip-install]");
    console.log("\nOptions:");
    console.log("  --skip-install    Scaffold files without running bun install");
    process.exit(0);
}

if (!targetArg) {
    console.error("Usage: bunx create-colonel <project-name> [--skip-install]");
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

if (!skipInstall) {
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
}

console.log("\nColonel app created successfully.\n");
console.log(`  cd ${targetArg}`);

if (skipInstall) {
    console.log("  bun install");
}

console.log("  bun run start\n");
