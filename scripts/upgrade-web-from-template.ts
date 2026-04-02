#!/usr/bin/env bun

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";

const TEMPLATE_DIR = path.join(import.meta.dir, "../packages/create-colonel/template");
const APP_DIR = path.join(import.meta.dir, "../apps/web");
const EXCLUDED_FILE_NAMES = new Set(["package.json"]);

function copyTree(sourceDir: string, targetDir: string, dryRun = false): number {
    let copied = 0;

    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
        if (entry.name.startsWith(".git")) {
            continue;
        }

        if (EXCLUDED_FILE_NAMES.has(entry.name)) {
            continue;
        }

        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            mkdirSync(targetPath, { recursive: true });
            copied += copyTree(sourcePath, targetPath, dryRun);
            continue;
        }

        if (entry.isFile()) {
            mkdirSync(path.dirname(targetPath), { recursive: true });
            if (!dryRun) {
                copyFileSync(sourcePath, targetPath);
            }
            console.log(`✓ ${dryRun ? "Would copy" : "Copied"}: ${path.relative(process.cwd(), targetPath)}`);
            copied++;
        }
    }

    return copied;
}

function diffTree(sourceDir: string, targetDir: string, prefix = ""): string[] {
    const diffs: string[] = [];

    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
        if (entry.name.startsWith(".git")) {
            continue;
        }

        if (EXCLUDED_FILE_NAMES.has(entry.name)) {
            continue;
        }

        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            if (!existsSync(targetPath)) {
                diffs.push(relativePath + "/");
                continue;
            }

            diffs.push(...diffTree(sourcePath, targetPath, relativePath));
            continue;
        }

        if (entry.isFile() && !existsSync(targetPath)) {
            diffs.push(relativePath);
        }
    }

    return diffs;
}

async function main() {
    const args = process.argv.slice(2);
    const apply = args.includes("--upgrade");

    console.log("🔄 " + (apply ? "Upgrading" : "Checking") + " apps/web from template...\n");

    const missing = diffTree(TEMPLATE_DIR, APP_DIR);

    if (!apply) {
        if (missing.length === 0) {
            console.log("✓ apps/web is already aligned with the template.");
            return;
        }

        console.log("Files missing or differing in apps/web:");
        for (const item of missing) {
            console.log(`  • ${item}`);
        }
        console.log("\nRun `bun run upgrade-web:from-template:apply` to copy the template tree into apps/web.");
        return;
    }

    const copied = copyTree(TEMPLATE_DIR, APP_DIR, false);
    console.log(`\n✓ Copied ${copied} file(s) from template into apps/web.`);
}

await main();
