import { existsSync } from "node:fs";
import { resolve } from "node:path";

type ReleaseArgs = {
    runRelease: boolean;
    dryRun: boolean;
    notesFile: string;
    tag: string | null;
    help: boolean;
};

const repoRoot = resolve(import.meta.dir, "..");

const parseArgs = (argv: string[]): ReleaseArgs => {
    const parsed: ReleaseArgs = {
        runRelease: false,
        dryRun: false,
        notesFile: "docs/release-notes-1.0.md",
        tag: null,
        help: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg) continue;

        if (arg === "--r") {
            parsed.runRelease = true;
            continue;
        }

        if (arg === "--dry-run") {
            parsed.dryRun = true;
            continue;
        }

        if (arg === "--notes-file") {
            parsed.notesFile = argv[i + 1] ?? parsed.notesFile;
            i += 1;
            continue;
        }

        if (arg === "--tag") {
            parsed.tag = argv[i + 1] ?? null;
            i += 1;
            continue;
        }

        if (arg === "--help" || arg === "-h") {
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
    console.log("  Push current branch and release tag to GitHub.");
    console.log("");
    console.log("Options:");
    console.log("  --r                  After push, create GitHub release and publish npm packages");
    console.log("  --dry-run            Show actions without executing them");
    console.log("  --tag <vX.Y.Z>       Override release tag (default: v<framework-version>)");
    console.log("  --notes-file <path>  Notes file for GitHub release (default: docs/release-notes-1.0.md)");
    console.log("  --help, -h           Show this help message");
};

const run = (
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

const isPublished = (name: string, version: string): boolean => {
    const result = run("npm", ["view", `${name}@${version}`, "version"], { allowFailure: true });
    return result.ok;
};

const publishIfNeeded = (cwd: string, name: string, version: string, dryRun: boolean): void => {
    if (!dryRun && isPublished(name, version)) {
        console.log(`${name}@${version} already published, skipping.`);
        return;
    }

    if (dryRun) {
        console.log(`[dry-run] npm publish --access public (cwd=${cwd})`);
        return;
    }

    run("npm", ["publish", "--access", "public"], { cwd });
    console.log(`Published ${name}@${version}`);
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
    usage();
    process.exit(0);
}

const framework = await readPackage("packages/framework/package.json");
const createColonel = await readPackage("packages/create-colonel/package.json");

if (!framework.version || !createColonel.version) {
    throw new Error("Missing version in framework or create-colonel package.json");
}

if (framework.version !== createColonel.version) {
    throw new Error(`Version mismatch: ${framework.name}@${framework.version} vs ${createColonel.name}@${createColonel.version}`);
}

const releaseTag = args.tag ?? `v${framework.version}`;
const notesPath = resolve(repoRoot, args.notesFile);

const status = run("git", ["status", "--porcelain"]);
if (status.stdout) {
    throw new Error("Working tree is not clean. Commit or stash changes before release automation.");
}

// Always push first.
run("git", ["push"], { dryRun: args.dryRun });

const hasLocalTag = run("git", ["rev-parse", "--verify", releaseTag], { allowFailure: true, dryRun: args.dryRun }).ok;
if (!hasLocalTag) {
    throw new Error(`Tag ${releaseTag} does not exist locally. Create and push the tag first.`);
}

run("git", ["push", "origin", releaseTag], { dryRun: args.dryRun });

if (!args.runRelease) {
    console.log("Push complete. Re-run with --r to also create GitHub release and publish npm packages.");
    process.exit(0);
}

// Ensure gh is available and authenticated.
run("gh", ["auth", "status"], { dryRun: args.dryRun });

const releaseExists = run("gh", ["release", "view", releaseTag], {
    allowFailure: true,
    dryRun: args.dryRun,
}).ok;

if (!releaseExists) {
    const ghArgs = ["release", "create", releaseTag, "--title", `Colonel ${framework.version}`];

    if (existsSync(notesPath)) {
        ghArgs.push("--notes-file", args.notesFile);
    } else {
        ghArgs.push("--generate-notes");
    }

    run("gh", ghArgs, { dryRun: args.dryRun });
} else {
    console.log(`GitHub release ${releaseTag} already exists, skipping creation.`);
}

publishIfNeeded(resolve(repoRoot, "packages/framework"), framework.name, framework.version, args.dryRun);
publishIfNeeded(resolve(repoRoot, "packages/create-colonel"), createColonel.name, createColonel.version, args.dryRun);

console.log("Release automation complete.");