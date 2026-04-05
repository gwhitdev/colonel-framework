import { existsSync } from "node:fs";
import { resolve } from "node:path";

type ReleaseArgs = {
    target: "both" | "npm" | "gh" | "push";
    packageTarget: "repo" | "framework" | "create-colonel";
    dryRun: boolean;
    verbose: boolean;
    notesFile: string | null;
    tag: string | null;
    help: boolean;
};

const repoRoot = resolve(import.meta.dir, "..");

const parseArgs = (argv: string[]): ReleaseArgs => {
    const parsed: ReleaseArgs = {
        target: "both",
        packageTarget: "repo",
        dryRun: false,
        verbose: false,
        notesFile: null,
        tag: null,
        help: false,
    };

    const setTarget = (next: "both" | "npm" | "gh" | "push"): void => {
        if (parsed.target !== "both" && parsed.target !== next) {
            throw new Error("Use only one publish target flag: --npm, --gh, or --push");
        }

        parsed.target = next;
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg) continue;

        if (arg === "--npm" || arg === "npm") {
            setTarget("npm");
            continue;
        }

        if (arg === "--gh" || arg === "gh") {
            setTarget("gh");
            continue;
        }

        if (arg === "--push" || arg === "push") {
            setTarget("push");
            continue;
        }

        if (arg === "--dry-run" || arg === "dry-run") {
            parsed.dryRun = true;
            continue;
        }

        if (arg === "--verbose" || arg === "-v" || arg === "verbose") {
            parsed.verbose = true;
            continue;
        }

        if (arg === "--notes-file") {
            parsed.notesFile = argv[i + 1] ?? parsed.notesFile;
            i += 1;
            continue;
        }

        if (arg === "--package") {
            const value = (argv[i + 1] ?? "").trim();
            if (value === "repo" || value === "framework" || value === "create-colonel") {
                parsed.packageTarget = value;
                i += 1;
                continue;
            }

            throw new Error("Invalid --package value. Use repo, framework, or create-colonel.");
        }

        if (arg === "--tag") {
            parsed.tag = argv[i + 1] ?? null;
            i += 1;
            continue;
        }

        if (arg === "--help" || arg === "-h" || arg === "help" || arg === "h") {
            parsed.help = true;
            continue;
        }
    }

    return parsed;
};

const usage = (): void => {
    console.log("Usage: bun scripts/release.ts [options]");
    console.log("");
    console.log("Default behavior:");
    console.log("  Push current branch and release tag, create GitHub release, and publish npm packages.");
    console.log("");
    console.log("Options:");
    console.log("  --npm                Push, then publish npm packages only");
    console.log("  --gh                 Push, then create GitHub release only");
    console.log("  --push               Push current branch and release tag only");
    console.log("  --dry-run            Show actions without executing them");
    console.log("  --verbose, -v        Print detailed command and decision logs");
    console.log("  --package <name>     Release scope: repo | framework | create-colonel (default: repo)");
    console.log("  --tag <tag>          Override release tag");
    console.log("  --notes-file <path>  Notes file for GitHub release (default: generate notes)");
    console.log("  --help, -h           Show this help message");
};

const vLog = (args: ReleaseArgs, message: string): void => {
    if (args.verbose) {
        console.log(`[verbose] ${message}`);
    }
};

const run = (
    cliArgs: ReleaseArgs,
    cmd: string,
    args: string[],
    options?: {
        cwd?: string;
        dryRun?: boolean;
        allowFailure?: boolean;
    }
): { ok: boolean; stdout: string; stderr: string } => {
    const cwd = options?.cwd ?? repoRoot;
    const dryRun = options?.dryRun ?? false;

    if (cliArgs.verbose && !dryRun) {
        console.log(`[run] ${cmd} ${args.join(" ")} (cwd=${cwd})`);
    }

    if (dryRun) {
        console.log(`[dry-run] ${cmd} ${args.join(" ")}`);
        return { ok: true, stdout: "", stderr: "" };
    }

    const result = Bun.spawnSync([cmd, ...args], {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
    });

    const stdout = result.stdout.toString().trim();
    const stderr = result.stderr.toString().trim();

    if (result.exitCode !== 0 && !options?.allowFailure) {
        if (stdout) console.error(stdout);
        if (stderr) console.error(stderr);
        throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
    }

    return { ok: result.exitCode === 0, stdout, stderr };
};

const readPackage = async (relativePath: string): Promise<{ name: string; version: string }> => {
    const path = resolve(repoRoot, relativePath);
    const json = JSON.parse(await Bun.file(path).text()) as { name?: string; version?: string };
    return {
        name: json.name ?? "",
        version: json.version ?? "",
    };
};

const scopeOf = (packageName: string): string | null => {
    if (!packageName.startsWith("@")) return null;
    const slash = packageName.indexOf("/");
    if (slash === -1) return null;
    return packageName.slice(0, slash);
};

const assertNpmPublishPreflight = (cliArgs: ReleaseArgs, packageNames: string[], dryRun: boolean): void => {
    if (dryRun) return;

    const whoami = run(cliArgs, "npm", ["whoami"], { allowFailure: true });
    if (!whoami.ok || !whoami.stdout) {
        throw new Error("npm auth check failed. Ensure NPM_TOKEN/npm login is configured for publish.");
    }

    const scopes = new Set<string>();
    for (const packageName of packageNames) {
        const scope = scopeOf(packageName);
        if (scope) scopes.add(scope);
    }

    for (const scope of scopes) {
        const access = run(cliArgs, "npm", ["access", "list", "packages", scope], { allowFailure: true });
        if (!access.ok) {
            console.warn(`Warning: could not verify npm access for ${scope}.`);
        }
    }
};

const isPublished = (cliArgs: ReleaseArgs, name: string, version: string): boolean => {
    const result = run(cliArgs, "npm", ["view", `${name}@${version}`, "version"], { allowFailure: true });
    return result.ok;
};

const publishIfNeeded = (cliArgs: ReleaseArgs, cwd: string, name: string, version: string, dryRun: boolean): void => {
    if (!dryRun && isPublished(cliArgs, name, version)) {
        console.log(`${name}@${version} already published, skipping.`);
        return;
    }

    if (dryRun) {
        console.log(`[dry-run] npm publish --access public (cwd=${cwd})`);
        return;
    }

    const publish = run(cliArgs, "npm", ["publish", "--access", "public"], {
        cwd,
        allowFailure: true,
    });

    if (!publish.ok) {
        const scope = scopeOf(name);
        const details = publish.stderr || publish.stdout || "npm publish failed";

        if (scope && /E404|Not Found/i.test(details)) {
            throw new Error(
                [
                    `npm publish failed for ${name}@${version}: ${details}`,
                    `Likely cause: npm token/account in this environment lacks publish access to ${scope}.`,
                    "Use an npm automation token from an owner/collaborator of that scope and set it as NPM_TOKEN.",
                ].join("\n")
            );
        }

        throw new Error(`npm publish failed for ${name}@${version}: ${details}`);
    }

    console.log(`Published ${name}@${version}`);
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
    usage();
    process.exit(0);
}

const framework = await readPackage("packages/framework/package.json");
const createColonel = await readPackage("packages/create-colonel/package.json");

const packageMeta = {
    framework: {
        name: framework.name,
        version: framework.version,
        cwd: resolve(repoRoot, "packages/framework"),
    },
    createColonel: {
        name: createColonel.name,
        version: createColonel.version,
        cwd: resolve(repoRoot, "packages/create-colonel"),
    },
};

if (!packageMeta.framework.version || !packageMeta.createColonel.version) {
    throw new Error("Missing version in framework or create-colonel package.json");
}

if (packageMeta.framework.version !== packageMeta.createColonel.version) {
    console.warn(
        [
            "Version mismatch detected; continuing release automation.",
            `${packageMeta.framework.name}@${packageMeta.framework.version}`,
            `${packageMeta.createColonel.name}@${packageMeta.createColonel.version}`,
        ].join(" ")
    );
}

const packageReleaseDefaults = {
    repo: {
        tag: `v${packageMeta.framework.version}`,
        title: `Colonel ${packageMeta.framework.version}`,
        notesFile: "docs/release-notes-1.0.md",
    },
    framework: {
        tag: `framework-v${packageMeta.framework.version}`,
        title: `${packageMeta.framework.name} ${packageMeta.framework.version}`,
        notesFile: null,
    },
    "create-colonel": {
        tag: `create-colonel-v${packageMeta.createColonel.version}`,
        title: `${packageMeta.createColonel.name} ${packageMeta.createColonel.version}`,
        notesFile: null,
    },
} as const;

const defaults = packageReleaseDefaults[args.packageTarget];
const releaseTag = args.tag ?? defaults.tag;
const releaseTitle = defaults.title;
const notesFile = args.notesFile ?? defaults.notesFile;
const notesPath = notesFile ? resolve(repoRoot, notesFile) : null;

const publishTargets =
    args.packageTarget === "framework"
        ? [packageMeta.framework]
        : args.packageTarget === "create-colonel"
            ? [packageMeta.createColonel]
            : [packageMeta.framework, packageMeta.createColonel];

vLog(args, `Repo root: ${repoRoot}`);
vLog(args, `Target: ${args.target}`);
vLog(args, `Package target: ${args.packageTarget}`);
vLog(args, `Release tag: ${releaseTag}`);
vLog(args, `Notes file: ${notesFile ?? "(generate-notes)"}`);

const status = run(args, "git", ["status", "--porcelain"]);
if (status.stdout && !args.dryRun) {
    throw new Error("Working tree is not clean. Commit or stash changes before release automation.");
}

// Always push first.
run(args, "git", ["push"], { dryRun: args.dryRun });

let hasLocalTag = run(args, "git", ["rev-parse", "--verify", releaseTag], { allowFailure: true, dryRun: args.dryRun }).ok;
if (!hasLocalTag) {
    vLog(args, `Local tag ${releaseTag} not found. Checking origin.`);

    const remoteTag = run(args, "git", ["ls-remote", "--tags", "origin", releaseTag], {
        allowFailure: true,
        dryRun: args.dryRun,
    });
    const hasRemoteTag = args.dryRun ? false : remoteTag.ok && remoteTag.stdout.length > 0;

    if (hasRemoteTag) {
        vLog(args, `Found remote tag ${releaseTag}. Fetching to local.`);
        run(args, "git", ["fetch", "origin", "tag", releaseTag], { dryRun: args.dryRun });
        hasLocalTag = true;
    } else {
        vLog(args, `Remote tag ${releaseTag} not found. Creating annotated local tag.`);
        run(args, "git", ["tag", "-a", releaseTag, "-m", releaseTitle], { dryRun: args.dryRun });
        hasLocalTag = true;
    }
}

if (!hasLocalTag) {
    throw new Error(`Unable to prepare local release tag ${releaseTag}.`);
}

run(args, "git", ["push", "origin", releaseTag], { dryRun: args.dryRun });

if (args.target === "push") {
    console.log("Push complete.");
    process.exit(0);
}

if (args.target === "both" || args.target === "gh") {
    // Ensure gh is available and authenticated.
    run(args, "gh", ["auth", "status"], { dryRun: args.dryRun });

    const releaseExists = run(args, "gh", ["release", "view", releaseTag], {
        allowFailure: true,
        dryRun: args.dryRun,
    }).ok;

    if (!releaseExists) {
        const ghArgs = ["release", "create", releaseTag, "--title", releaseTitle];

        if (notesFile && notesPath && existsSync(notesPath)) {
            ghArgs.push("--notes-file", notesFile);
        } else {
            ghArgs.push("--generate-notes");
        }

        run(args, "gh", ghArgs, { dryRun: args.dryRun });
    } else {
        console.log(`GitHub release ${releaseTag} already exists, skipping creation.`);
    }
}

if (args.target === "both" || args.target === "npm") {
    assertNpmPublishPreflight(
        args,
        publishTargets.map((pkg) => pkg.name),
        args.dryRun
    );

    for (const pkg of publishTargets) {
        publishIfNeeded(args, pkg.cwd, pkg.name, pkg.version, args.dryRun);
    }
}

const targetLabel = args.target === "both" ? "GitHub + npm" : args.target;
console.log(`Release automation complete (${targetLabel}).`);