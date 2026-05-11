import { resolve } from "node:path";
import { ask, isValidProjectName } from "./prompts.js";
import { scaffold, defaultSource, inferProjectName } from "./scaffold.js";

const HELP = `\
Usage: create-vibe-app <project-directory> [options]

Scaffolds a Next.js + Supabase + Vercel project pre-wired for vibe coders.

Arguments:
  <project-directory>     Where to create the project (a new directory).

Options:
  --template <source>     degit source for the template repo.
                          Default: michaelreik/vibe-starter/template
  --local <path>          Use a local copy of the template instead of fetching.
                          Useful for development of the template itself.
  -h, --help              Show this help.

Examples:
  npx @michaelreik/create-vibe-app my-recipes
  npx @michaelreik/create-vibe-app my-recipes --template some-org/some-repo/template
  npx @michaelreik/create-vibe-app my-recipes --local ../vibe-starter/template
`;

export async function run(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }

  let target = args.positional[0];
  if (!target) {
    target = await ask("Project name");
    if (!target) throw new Error("A project name is required.");
  }

  const inferredName = inferProjectName(target);
  const name = inferredName;
  if (!isValidProjectName(name)) {
    throw new Error(
      `"${name}" is not a valid npm package name. Use lowercase letters, digits, hyphens, dots, or underscores; start with a letter or digit.`,
    );
  }

  const source = args.local ? `local:${resolve(args.local)}` : args.template ?? defaultSource();
  const absoluteTarget = resolve(target);

  console.log(`\nScaffolding ${name} → ${absoluteTarget}`);
  console.log(`Template:    ${args.local ? `local copy at ${args.local}` : source}\n`);

  await scaffold({ name, target: absoluteTarget, source });

  console.log(`\n✓ Project ready.\n`);
  console.log(`Next steps:`);
  console.log(`  cd ${target}`);
  console.log(`  # open in Claude Code (or any agent that reads .claude/)`);
  console.log(`  # then type:  /setup\n`);
}

function parseArgs(argv) {
  const out = { positional: [], help: false, template: null, local: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--template") out.template = argv[++i];
    else if (a === "--local") out.local = argv[++i];
    else if (a.startsWith("--template=")) out.template = a.slice("--template=".length);
    else if (a.startsWith("--local=")) out.local = a.slice("--local=".length);
    else out.positional.push(a);
  }
  return out;
}
