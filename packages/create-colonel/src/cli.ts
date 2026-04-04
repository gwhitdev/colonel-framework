#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type TelemetryConsent = "yes" | "no";

const DEFAULT_TELEMETRY_ENDPOINT = "https://colonel-telemetry.vercel.app/api/ingest";

const deriveProvisionEndpoint = (ingestEndpoint: string, publicProvision = false): string => {
    const suffix = publicProvision ? "/api/provision-public" : "/api/provision-app";

    if (ingestEndpoint.endsWith("/api/ingest")) {
        return `${ingestEndpoint.slice(0, -"/api/ingest".length)}${suffix}`;
    }

    return `${ingestEndpoint.replace(/\/$/, "")}${suffix}`;
};

const upsertEnv = (content: string, key: string, value: string): string => {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(content)) {
        return content.replace(pattern, line);
    }

    const suffix = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    return `${content}${suffix}${line}\n`;
};

const normalizeConsent = (value: string | undefined): TelemetryConsent | null => {
    if (!value) return null;

    const normalized = value.trim().toLowerCase();
    if (["y", "yes", "true", "1"].includes(normalized)) return "yes";
    if (["n", "no", "false", "0"].includes(normalized)) return "no";
    return null;
};

const parseOptionValue = (args: string[], name: string): string | undefined => {
    const index = args.indexOf(name);
    if (index === -1) return undefined;
    return args[index + 1];
};

const trackScaffoldEvent = async (payload: Record<string, unknown>, endpoint: string, appId: string, apiKey: string): Promise<void> => {
    try {
        await fetch(endpoint, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-colonel-telemetry-key": apiKey,
            },
            body: JSON.stringify({
                name: "scaffold_created",
                timestamp: new Date().toISOString(),
                source: "create-colonel",
                appId,
                environment: process.env.NODE_ENV ?? "development",
                runtime: "bun",
                properties: payload,
            }),
        });
    } catch {
        // Do not block scaffolding on telemetry transport failures.
    }
};

const provisionTelemetryApp = async (
    appName: string,
    source: string,
    provisionEndpoint: string,
    provisionToken?: string
): Promise<{ appId: string; ingestKey: string } | null> => {
    try {
        const headers: Record<string, string> = {
            "content-type": "application/json",
        };

        if (provisionToken) {
            headers.authorization = `Bearer ${provisionToken}`;
        }

        const response = await fetch(provisionEndpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({ appName, source }),
        });

        if (!response.ok) return null;
        const data = (await response.json()) as { appId?: string; ingestKey?: string };
        if (!data.appId || !data.ingestKey) return null;

        return { appId: data.appId, ingestKey: data.ingestKey };
    } catch {
        return null;
    }
};

const askTelemetryConsent = async (): Promise<TelemetryConsent> => {
    if (!input.isTTY || !output.isTTY) {
        return "no";
    }

    const rl = createInterface({ input, output });
    const answer = await rl.question("Share anonymous usage stats to help improve Colonel? (y/N): ");
    rl.close();

    return normalizeConsent(answer) ?? "no";
};

const configureTelemetryEnv = (
    targetDir: string,
    consent: TelemetryConsent,
    endpoint: string,
    appId?: string,
    apiKey?: string
): void => {
    const envPath = resolve(targetDir, ".env");
    const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

    let content = upsertEnv(existing, "COLONEL_TELEMETRY_ENABLED", consent === "yes" ? "true" : "false");
    content = upsertEnv(content, "COLONEL_TELEMETRY_ENDPOINT", endpoint);
    content = upsertEnv(content, "COLONEL_TELEMETRY_APP_ID", appId ?? "");
    content = upsertEnv(content, "COLONEL_TELEMETRY_KEY", apiKey ?? "");
    writeFileSync(envPath, content);
};

const args = process.argv.slice(2);
const targetArg = args.find((arg) => !arg.startsWith("-"));
const skipInstall = args.includes("--skip-install");
const showHelp = args.includes("--help") || args.includes("-h");
const telemetryFlag = parseOptionValue(args, "--telemetry");
const telemetryConsentFromFlag = normalizeConsent(telemetryFlag);
const telemetryEndpoint = parseOptionValue(args, "--telemetry-endpoint") ?? process.env.COLONEL_TELEMETRY_ENDPOINT ?? DEFAULT_TELEMETRY_ENDPOINT;
const secureProvisionEndpoint = parseOptionValue(args, "--telemetry-provision-endpoint")
    ?? process.env.COLONEL_TELEMETRY_PROVISION_ENDPOINT
    ?? deriveProvisionEndpoint(telemetryEndpoint, false);
const publicProvisionEndpoint = parseOptionValue(args, "--telemetry-public-provision-endpoint")
    ?? process.env.COLONEL_TELEMETRY_PUBLIC_PROVISION_ENDPOINT
    ?? deriveProvisionEndpoint(telemetryEndpoint, true);
const provisionToken = parseOptionValue(args, "--telemetry-provision-token")
    ?? process.env.COLONEL_TELEMETRY_PROVISION_TOKEN;

if (showHelp) {
    console.log("Usage: bunx create-colonel <project-name> [--skip-install] [--telemetry yes|no] [--telemetry-endpoint <url>] [--telemetry-provision-endpoint <url>] [--telemetry-public-provision-endpoint <url>] [--telemetry-provision-token <token>]");
    console.log("\nOptions:");
    console.log("  --skip-install    Scaffold files without running bun install");
    console.log("  --telemetry       Set anonymous telemetry consent without interactive prompt");
    console.log("  --telemetry-endpoint  Override telemetry ingestion endpoint");
    console.log("  --telemetry-provision-endpoint  Override telemetry app provisioning endpoint");
    console.log("  --telemetry-public-provision-endpoint  Override public app provisioning endpoint");
    console.log("  --telemetry-provision-token  Bearer token used for telemetry app provisioning");
    process.exit(0);
}

if (!targetArg) {
    console.error("Usage: bunx create-colonel <project-name> [--skip-install] [--telemetry yes|no] [--telemetry-endpoint <url>] [--telemetry-provision-endpoint <url>] [--telemetry-public-provision-endpoint <url>] [--telemetry-provision-token <token>]");
    process.exit(1);
}

if (telemetryFlag && !telemetryConsentFromFlag) {
    console.error("Invalid --telemetry value. Use yes or no.");
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

const consent = telemetryConsentFromFlag ?? await askTelemetryConsent();
let provisionedAppId: string | undefined;
let provisionedIngestKey: string | undefined;

if (consent === "yes") {
    const provisioned = provisionToken
        ? await provisionTelemetryApp(
            basename(targetDir),
            "create-colonel",
            secureProvisionEndpoint,
            provisionToken
        )
        : await provisionTelemetryApp(
            basename(targetDir),
            "create-colonel",
            publicProvisionEndpoint
        );

    provisionedAppId = provisioned?.appId;
    provisionedIngestKey = provisioned?.ingestKey;

    if (!provisionedAppId || !provisionedIngestKey) {
        console.warn("Telemetry consented but provisioning did not return credentials.");
    }
}

configureTelemetryEnv(targetDir, consent, telemetryEndpoint, provisionedAppId, provisionedIngestKey);

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

if (consent === "yes" && provisionedAppId && provisionedIngestKey) {
    await trackScaffoldEvent({
        projectName: basename(targetDir),
        skipInstall,
        template: "create-colonel",
    }, telemetryEndpoint, provisionedAppId, provisionedIngestKey);
}

console.log("\nColonel app created successfully.\n");
console.log(`  cd ${targetArg}`);

if (skipInstall) {
    console.log("  bun install");
}

console.log("  bun run start\n");
