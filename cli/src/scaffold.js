import { mkdir, readFile, writeFile, access, cp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, basename } from "node:path";
import degit from "degit";

const DEFAULT_REPO = "vibe-starter/vibe-starter/template";
// Format expected by degit: <user>/<repo>[/<subdir>][#ref]

const LOCAL_COPY_SKIP = new Set([
  "node_modules",
  ".next",
  ".vercel",
  "playwright-report",
  "test-results",
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".vibe-state.json",
  ".turbo",
  "coverage",
]);

export async function scaffold({ name, target, source }) {
  await ensureEmptyDir(target);

  if (source.startsWith("local:")) {
    const localPath = source.slice("local:".length);
    await cp(localPath, target, {
      recursive: true,
      filter: (src) => {
        const name = basename(src);
        return !LOCAL_COPY_SKIP.has(name);
      },
    });
  } else {
    const emitter = degit(source, { cache: false, force: false, verbose: false });
    await emitter.clone(target);
  }

  await renameInPackageJson(target, name);
  await renameInReadme(target, name);
  await runGitInit(target);
}

async function ensureEmptyDir(target) {
  try {
    await access(target);
    throw new Error(
      `Directory "${target}" already exists. Pick a different name or remove it first.`,
    );
  } catch (err) {
    if (err.code === "ENOENT") {
      await mkdir(target, { recursive: true });
      return;
    }
    throw err;
  }
}

async function renameInPackageJson(target, name) {
  const path = resolve(target, "package.json");
  try {
    const raw = await readFile(path, "utf8");
    const pkg = JSON.parse(raw);
    pkg.name = name;
    await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

async function renameInReadme(target, name) {
  const path = resolve(target, "README.md");
  try {
    const raw = await readFile(path, "utf8");
    const updated = raw.replace(/^# vibe-starter \(template\)/m, `# ${name}`);
    if (updated !== raw) await writeFile(path, updated, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

function runGitInit(target) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn("git", ["init", "-q", "--initial-branch=main"], {
      cwd: target,
      stdio: "ignore",
    });
    child.on("close", (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`git init exited with code ${code}`));
    });
    child.on("error", rejectP);
  });
}

export function defaultSource() {
  return DEFAULT_REPO;
}

export function inferProjectName(target) {
  return basename(resolve(target));
}
