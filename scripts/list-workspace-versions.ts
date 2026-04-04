import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type BumpType = "none" | "patch" | "minor" | "major";

type PackageRow = {
    name: string;
    version: string;
    path: string;
    dir: string;
    isPrivate: boolean;
    latest: string;
    status: string;
    updateTo: string;
    suggestedBump: BumpType;
    suggestedVersion: string;
    reason: string;
};

type ParsedArgs = {
    showAll: boolean;
    setVersion: string | null;
    useNext: boolean;
    dryRun: boolean;
    showHelp: boolean;
    syncDeps: boolean;
    sinceRef: string | null;
    packageFilters: string[];
};

type WorkspaceManifest = {
    path: string;
    name: string;
    version: string;
    json: Record<string, unknown>;
};

const repoRoot = resolve(import.meta.dir, "..");
const glob = new Bun.Glob("**/package.json");
const ignoredSegments = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next"]);
const npmLatestCache = new Map<string, string>();

const parseArgs = (argv: string[]): ParsedArgs => {
    const parsed: ParsedArgs = {
        showAll: false,
        setVersion: null,
        useNext: false,
        dryRun: false,
        showHelp: false,
        syncDeps: false,
        sinceRef: null,
        packageFilters: [],
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg) continue;

        if (arg === "--all" || arg === "-a") {
            parsed.showAll = true;
            continue;
        }

        if (arg === "--next") {
            parsed.useNext = true;
            continue;
        }

        if (arg === "--dry-run") {
            parsed.dryRun = true;
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            parsed.showHelp = true;
            continue;
        }

        if (arg === "--sync-deps") {
            parsed.syncDeps = true;
            continue;
        }

        if (arg === "--set") {
            parsed.setVersion = argv[i + 1] ?? null;
            i += 1;
            continue;
        }

        if (arg === "--since") {
            parsed.sinceRef = argv[i + 1] ?? null;
            i += 1;
            continue;
        }

        if (arg === "--package") {
            const value = argv[i + 1] ?? "";
            if (value) {
                parsed.packageFilters.push(value);
            }
            i += 1;
            continue;
        }
    }

    return parsed;
};

const usage = (): void => {
    console.log("Usage: bun scripts/list-workspace-versions.ts [options]");
    console.log("");
    console.log("Options:");
    console.log("  --all, -a            Include private packages (default: publishable only)");
    console.log("  --package <name>     Restrict actions to package name (repeatable)");
    console.log("  --set <x.y.z>        Set selected package versions to an explicit version");
    console.log("  --next               Bump selected package versions using commit-based semver heuristic");
    console.log("  --since <git-ref>    Analyze commits from this ref (default: latest tag)");
    console.log("  --dry-run            Show planned version writes without changing files");
    console.log("  --sync-deps          Update workspace dependency ranges to bumped versions");
};

const parseVersion = (value: string): number[] => {
    const base = value.trim().replace(/^v/i, "").split("-")[0] ?? "";
    return base.split(".").map((part) => {
        const n = Number.parseInt(part, 10);
        return Number.isNaN(n) ? 0 : n;
    });
};

const compareVersions = (a: string, b: string): number => {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    const length = Math.max(pa.length, pb.length);

    for (let i = 0; i < length; i++) {
        const av = pa[i] ?? 0;
        const bv = pb[i] ?? 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }

    return 0;
};

const nextVersion = (current: string, bump: BumpType): string => {
    const [major = 0, minor = 0, patch = 0] = parseVersion(current);

    if (bump === "major") {
        return `${major + 1}.0.0`;
    }

    if (bump === "minor") {
        return `${major}.${minor + 1}.0`;
    }

    if (bump === "patch") {
        return `${major}.${minor}.${patch + 1}`;
    }

    return current;
};

const isSemver = (value: string): boolean => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);

const runGit = (args: string[]): { ok: boolean; output: string } => {
    const result = Bun.spawnSync(["git", ...args], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
    });

    const output = result.stdout.toString().trim();
    return { ok: result.exitCode === 0, output };
};

const latestGitTag = (): string | null => {
    const res = runGit(["describe", "--tags", "--abbrev=0"]);
    return res.ok && res.output ? res.output : null;
};

const commitHeuristic = (sinceRef: string | null, packageDir: string): { bump: BumpType; reason: string } => {
    const range = sinceRef ? `${sinceRef}..HEAD` : "HEAD";
    const relativeDir = packageDir.replace(`${repoRoot}/`, "");

    const commitsRes = runGit(["log", "--format=%s%n%b", range, "--", relativeDir]);
    if (!commitsRes.ok || !commitsRes.output) {
        return { bump: "none", reason: "no committed changes" };
    }

    const text = commitsRes.output;
    const lines = text.split("\n").filter(Boolean);
    const hasBreaking = /BREAKING CHANGE|^[a-z]+(\([^)]*\))?!:/im.test(text);
    const hasFeature = lines.some((line) => /^feat(\([^)]*\))?:/i.test(line));

    const diffRes = runGit(["diff", "--shortstat", range, "--", relativeDir]);
    const diffText = diffRes.output;
    const filesChanged = Number.parseInt((diffText.match(/(\d+)\s+files?\s+changed/)?.[1] ?? "0"), 10);
    const insertions = Number.parseInt((diffText.match(/(\d+)\s+insertions?/)?.[1] ?? "0"), 10);
    const deletions = Number.parseInt((diffText.match(/(\d+)\s+deletions?/)?.[1] ?? "0"), 10);
    const churn = insertions + deletions;

    if (hasBreaking) {
        return { bump: "major", reason: "breaking change detected in commit messages" };
    }

    if (hasFeature) {
        return { bump: "minor", reason: "feature commits detected" };
    }

    if (filesChanged > 0) {
        if (churn >= 400 || filesChanged >= 15) {
            return { bump: "minor", reason: `large committed footprint (${filesChanged} files, ${churn} lines)` };
        }

        return { bump: "patch", reason: `committed changes detected (${filesChanged} files)` };
    }

    return { bump: "none", reason: "no committed changes" };
};

const fetchLatestFromNpm = async (name: string): Promise<string> => {
    const cached = npmLatestCache.get(name);
    if (cached) {
        return cached;
    }

    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;

    try {
        const response = await fetch(url);
        if (response.status === 404) {
            npmLatestCache.set(name, "(unpublished)");
            return "(unpublished)";
        }

        if (!response.ok) {
            npmLatestCache.set(name, "(lookup failed)");
            return "(lookup failed)";
        }

        const body = await response.json() as { "dist-tags"?: { latest?: string } };
        const latest = body["dist-tags"]?.latest ?? "(no latest tag)";
        npmLatestCache.set(name, latest);
        return latest;
    } catch {
        npmLatestCache.set(name, "(lookup failed)");
        return "(lookup failed)";
    }
};

const args = parseArgs(process.argv.slice(2));

if (args.showHelp) {
    usage();
    process.exit(0);
}

if (args.setVersion && !isSemver(args.setVersion)) {
    console.error(`Invalid --set value: ${args.setVersion}. Expected semver like 1.2.3`);
    usage();
    process.exit(1);
}

if (args.setVersion && args.useNext) {
    console.error("Use only one of --set or --next.");
    usage();
    process.exit(1);
}

if (args.packageFilters.length > 0 && !args.showAll) {
    // If package filter is provided, include private packages too so filters can target them.
    args.showAll = true;
}

const sinceRef = args.sinceRef ?? latestGitTag();

const rows: PackageRow[] = [];

for await (const match of glob.scan({ cwd: repoRoot, absolute: false })) {
    const segments = match.split("/");
    if (segments.some((segment) => ignoredSegments.has(segment))) {
        continue;
    }

    const fullPath = resolve(repoRoot, match);
    if (!existsSync(fullPath)) {
        continue;
    }

    const parsed = JSON.parse(await Bun.file(fullPath).text()) as {
        name?: string;
        version?: string;
        private?: boolean;
    };

    const name = parsed.name ?? "(unnamed)";
    const version = parsed.version ?? "(no version)";
    const isPrivate = parsed.private === true;
    const dir = dirname(fullPath);

    if (!args.showAll && isPrivate) {
        continue;
    }

    if (args.packageFilters.length > 0 && !args.packageFilters.includes(name)) {
        continue;
    }

    let latest = "(n/a)";
    let status = "n/a";
    let updateTo = "-";

    if (!isPrivate && name !== "(unnamed)") {
        latest = await fetchLatestFromNpm(name);

        if (version === "(no version)") {
            status = "missing local version";
            updateTo = latest;
        } else if (latest === "(unpublished)") {
            status = "not published";
            updateTo = version;
        } else if (latest === "(lookup failed)" || latest === "(no latest tag)") {
            status = "unknown";
            updateTo = "-";
        } else {
            const cmp = compareVersions(version, latest);
            if (cmp < 0) {
                status = "update available";
                updateTo = latest;
            } else if (cmp === 0) {
                status = "up-to-date";
                updateTo = "-";
            } else {
                status = "ahead of npm";
                updateTo = version;
            }
        }
    } else if (isPrivate) {
        latest = "(private)";
    }

    const heuristic = version === "(no version)"
        ? { bump: "none" as BumpType, reason: "no version field" }
        : commitHeuristic(sinceRef, dir);

    rows.push({
        name,
        version,
        path: match,
        dir,
        isPrivate,
        latest,
        status,
        updateTo,
        suggestedBump: heuristic.bump,
        suggestedVersion: version === "(no version)" ? "-" : nextVersion(version, heuristic.bump),
        reason: heuristic.reason,
    });
}

rows.sort((a, b) => a.path.localeCompare(b.path));

if (rows.length === 0) {
    console.log("No matching package.json files found.");
    process.exit(0);
}

const applyVersionUpdates = async (): Promise<void> => {
    const targets = rows.filter((row) => row.version !== "(no version)");
    if (targets.length === 0) {
        console.log("No versioned package.json files matched the selection.");
        return;
    }

    const updates: Array<{ row: PackageRow; next: string }> = [];

    for (const row of targets) {
        const next = args.setVersion
            ? args.setVersion
            : (args.useNext ? row.suggestedVersion : row.version);

        if (!next || next === "-" || next === row.version) {
            continue;
        }

        updates.push({ row, next });
    }

    if (updates.length === 0) {
        console.log("No package versions needed updating with the selected mode.");
        return;
    }

    const updateMap = new Map<string, string>();
    const manifests: WorkspaceManifest[] = [];

    for await (const match of glob.scan({ cwd: repoRoot, absolute: false })) {
        const segments = match.split("/");
        if (segments.some((segment) => ignoredSegments.has(segment))) {
            continue;
        }

        const fullPath = resolve(repoRoot, match);
        if (!existsSync(fullPath)) {
            continue;
        }

        const json = JSON.parse(await Bun.file(fullPath).text()) as Record<string, unknown>;
        const name = typeof json.name === "string" ? json.name : "";
        const version = typeof json.version === "string" ? json.version : "";

        manifests.push({
            path: match,
            name,
            version,
            json,
        });
    }

    for (const update of updates) {
        updateMap.set(update.row.name, update.next);

        const manifest = manifests.find((entry) => entry.path === update.row.path);
        if (manifest) {
            manifest.json.version = update.next;
            manifest.version = update.next;
        }

        if (args.dryRun) {
            console.log(`[dry-run] ${update.row.name}: ${update.row.version} -> ${update.next}`);
        } else {
            console.log(`${update.row.name}: ${update.row.version} -> ${update.next}`);
        }
    }

    if (args.syncDeps) {
        for (const manifest of manifests) {
            const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;

            for (const section of sections) {
                const deps = manifest.json[section] as Record<string, string> | undefined;
                if (!deps || typeof deps !== "object") {
                    continue;
                }

                for (const [depName, depVersion] of Object.entries(deps)) {
                    const next = updateMap.get(depName);
                    if (!next) {
                        continue;
                    }

                    let replacement = depVersion;
                    if (depVersion === "workspace:*" || depVersion.startsWith("workspace:")) {
                        replacement = depVersion;
                    } else if (depVersion.startsWith("~")) {
                        replacement = `~${next}`;
                    } else if (depVersion.startsWith("^")) {
                        replacement = `^${next}`;
                    } else {
                        replacement = next;
                    }

                    if (replacement !== depVersion) {
                        deps[depName] = replacement;
                        if (args.dryRun) {
                            console.log(`[dry-run] ${manifest.name || manifest.path} ${section}.${depName}: ${depVersion} -> ${replacement}`);
                        } else {
                            console.log(`${manifest.name || manifest.path} ${section}.${depName}: ${depVersion} -> ${replacement}`);
                        }
                    }
                }
            }
        }
    }

    if (args.dryRun) {
        return;
    }

    for (const manifest of manifests) {
        const fullPath = resolve(repoRoot, manifest.path);
        writeFileSync(fullPath, `${JSON.stringify(manifest.json, null, 2)}\n`);
    }
};

if (args.setVersion || args.useNext) {
    await applyVersionUpdates();
    process.exit(0);
}

const nameWidth = Math.max("Package".length, ...rows.map((r) => r.name.length));
const versionWidth = Math.max("Version".length, ...rows.map((r) => r.version.length));
const latestWidth = Math.max("Latest".length, ...rows.map((r) => r.latest.length));
const statusWidth = Math.max("Status".length, ...rows.map((r) => r.status.length));
const updateWidth = Math.max("Update To".length, ...rows.map((r) => r.updateTo.length));
const bumpWidth = Math.max("Suggested".length, ...rows.map((r) => r.suggestedVersion.length));
const reasonWidth = Math.max("Reason".length, ...rows.map((r) => r.reason.length));

const pad = (value: string, width: number): string => value.padEnd(width, " ");

console.log(`${pad("Package", nameWidth)}  ${pad("Version", versionWidth)}  ${pad("Latest", latestWidth)}  ${pad("Status", statusWidth)}  ${pad("Update To", updateWidth)}  ${pad("Suggested", bumpWidth)}  ${pad("Reason", reasonWidth)}  Path`);
console.log(`${"-".repeat(nameWidth)}  ${"-".repeat(versionWidth)}  ${"-".repeat(latestWidth)}  ${"-".repeat(statusWidth)}  ${"-".repeat(updateWidth)}  ${"-".repeat(bumpWidth)}  ${"-".repeat(reasonWidth)}  ${"-".repeat(4)}`);

for (const row of rows) {
    console.log(`${pad(row.name, nameWidth)}  ${pad(row.version, versionWidth)}  ${pad(row.latest, latestWidth)}  ${pad(row.status, statusWidth)}  ${pad(row.updateTo, updateWidth)}  ${pad(row.suggestedVersion, bumpWidth)}  ${pad(row.reason, reasonWidth)}  ${row.path}`);
}