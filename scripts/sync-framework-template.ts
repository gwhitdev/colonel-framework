#!/usr/bin/env bun

import { readdirSync } from "fs";
import path from "path";

const FRAMEWORK_DIR = path.join(import.meta.dir, "../packages/framework/src");
const TEMPLATE_DIR = path.join(import.meta.dir, "../packages/create-colonel/template/src");

function scanTree(rootDir: string): Set<string> {
    const files = new Set<string>();

    const walk = (currentDir: string, prefix = "") => {
        for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
            const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
            const absolutePath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                if (!entry.name.startsWith(".")) {
                    walk(absolutePath, relativePath);
                }
                continue;
            }

            if (entry.isFile() && entry.name.endsWith(".ts")) {
                files.add(relativePath);
            }
        }
    };

    walk(rootDir);
    return files;
}

function printDiff(title: string, items: string[]) {
    if (items.length === 0) {
        console.log(`✓ ${title}`);
        return;
    }

    console.log(`⚠️  ${title}`);
    for (const item of items) {
        console.log(`   • ${item}`);
    }
}

async function main() {
    console.log("🔄 Auditing framework and template source trees...\n");

    const frameworkFiles = scanTree(FRAMEWORK_DIR);
    const templateFiles = scanTree(TEMPLATE_DIR);

    const onlyInFramework = [...frameworkFiles].filter((file) => !templateFiles.has(file)).sort();
    const onlyInTemplate = [...templateFiles].filter((file) => !frameworkFiles.has(file)).sort();

    console.log(`Framework .ts files: ${frameworkFiles.size}`);
    console.log(`Template .ts files:  ${templateFiles.size}\n`);

    printDiff("Files only in framework", onlyInFramework);
    printDiff("Files only in template", onlyInTemplate);

    if (onlyInFramework.length === 0 && onlyInTemplate.length === 0) {
        console.log("\n✓ Framework and template trees are identical.");
        return;
    }

    console.log("\nℹ️  The trees are not identical. This script is audit-only because the two hierarchies serve different roles.");
}

await main();
