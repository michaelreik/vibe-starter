import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function ask(question, defaultValue) {
  const rl = createInterface({ input: stdin, output: stdout });
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  rl.close();
  return answer || defaultValue || "";
}

export function isValidProjectName(name) {
  if (!name) return false;
  if (name.length > 64) return false;
  // npm package name rules: lowercase letters, digits, hyphens, underscores. No spaces.
  return /^[a-z0-9][a-z0-9._-]*$/.test(name);
}
