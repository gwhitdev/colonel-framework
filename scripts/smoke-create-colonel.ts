import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const repoRoot = resolve(import.meta.dir, "..");
const cliPath = resolve(repoRoot, "packages", "create-colonel", "src", "cli.ts");

const tempRoot = mkdtempSync(join(tmpdir(), "colonel-smoke-"));
const projectDir = join(tempRoot, "smoke-app");
const port = 6200 + Math.floor(Math.random() * 300);

const waitForServer = async (url: string, attempts = 40, delayMs = 250): Promise<void> => {
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
        } catch {
            // Server may not be up yet.
        }

        await Bun.sleep(delayMs);
    }

    throw new Error(`Timed out waiting for ${url}`);
};

let serverProcess: Bun.Subprocess | null = null;

try {
    console.log(`Generating smoke project: ${projectDir}`);

    const create = Bun.spawnSync(["bun", cliPath, projectDir], {
        cwd: repoRoot,
        stdout: "inherit",
        stderr: "inherit",
    });

    if (create.exitCode !== 0) {
        throw new Error(`create-colonel smoke generation failed with exit code ${create.exitCode}`);
    }

    console.log("Starting generated app...");
    serverProcess = Bun.spawn(["bun", "src/index.ts"], {
        cwd: projectDir,
        env: {
            ...process.env,
            PORT: String(port),
        },
        stdout: "inherit",
        stderr: "inherit",
    });

    await waitForServer(`http://localhost:${port}/health`);

    const homepage = await fetch(`http://localhost:${port}/`);
    if (!homepage.ok) {
        throw new Error(`Generated app homepage check failed with status ${homepage.status}`);
    }

    console.log("create-colonel smoke test passed.");
} finally {
    if (serverProcess) {
        serverProcess.kill();
        await serverProcess.exited;
    }

    rmSync(tempRoot, { recursive: true, force: true });
}