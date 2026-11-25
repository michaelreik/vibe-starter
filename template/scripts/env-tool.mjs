#!/usr/bin/env node
// Manages .env.local without ever printing a secret value, so keys do not end
// up in a chat transcript. Commands:
//   init                      create .env.local from .env.example
//   slot NAME                 add an empty NAME= line for the user to fill in
//   set NAME VALUE            store a NON-secret value
//   generate NAME             store a random secret
//   check NAME [PREFIX]       report whether NAME is set (and starts with PREFIX)
//   supabase PROJECT_REF      store project URL and API keys from Supabase CLI
//   push NAME...              send values to Vercel (production and preview)
//   unset NAME                remove a variable from .env.local
//   cloudflare-dns ZONE TYPE NAME CONTENT
//                             create a DNS record (token: CLOUDFLARE_API_TOKEN);
//                             never changes or deletes existing records
//   open                      open .env.local in a text editor
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";

const FILE = ".env.local";
const isWindows = process.platform === "win32";
const [command, ...args] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validName(name) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name ?? "")) fail("Invalid variable name.");
  return name;
}

function read() {
  return existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
}

function values() {
  return parseEnv(read());
}

function write(text) {
  writeFileSync(FILE, text, { mode: 0o600 });
  chmodSync(FILE, 0o600);
}

function save(name, value) {
  if (/["\r\n]/.test(value)) fail(`${name} contains unsupported characters.`);
  const line = `${name}=${value === "" ? "" : `"${value}"`}`;
  const lines = read().split(/\r?\n/);
  const index = lines.findIndex((l) => l.startsWith(`${name}=`));
  if (index >= 0) lines[index] = line;
  else {
    while (lines.length && lines.at(-1) === "") lines.pop();
    lines.push(line, "");
  }
  write(lines.join("\n"));
}

// shell:true is only needed for the .cmd shims on Windows. Every argument is a
// literal or has been validated, and secret values only travel over stdin.
function run(cmd, cmdArgs, input) {
  return spawnSync(cmd, cmdArgs, { input, encoding: "utf8", shell: isWindows });
}

function pickKey(keys, legacyName, type) {
  const usable = (k) => {
    const value = k?.api_key;
    return value && !/[*·•]/.test(value) ? value : undefined;
  };
  return (
    usable(keys.find((k) => k.name === legacyName)) ??
    usable(keys.find((k) => k.type === type))
  );
}

switch (command) {
  case "init": {
    if (!existsSync(FILE)) write(readFileSync(".env.example", "utf8"));
    console.log(`${FILE} is ready.`);
    break;
  }
  case "slot": {
    const name = validName(args[0]);
    if (values()[name] === undefined) save(name, "");
    console.log(`${name} has a line in ${FILE}.`);
    break;
  }
  case "set": {
    const name = validName(args[0]);
    if (!args[1]) fail("Missing value.");
    save(name, args[1]);
    console.log(`${name} saved.`);
    break;
  }
  case "generate": {
    const name = validName(args[0]);
    if (!values()[name]) save(name, randomBytes(24).toString("base64url"));
    console.log(`${name} is set (value not shown).`);
    break;
  }
  case "check": {
    const name = validName(args[0]);
    const value = values()[name];
    if (!value) fail(`${name} is missing.`);
    if (args[1] && !value.startsWith(args[1]))
      fail(`${name} does not start with ${args[1]}.`);
    console.log(`${name} is set (value not shown).`);
    break;
  }
  case "supabase": {
    const ref = args[0];
    if (!/^[a-z0-9]{15,30}$/.test(ref ?? "")) fail("Invalid project ref.");
    const result = run("npx", [
      "supabase", "projects", "api-keys", "--project-ref", ref, "-o", "json",
    ]);
    if (result.status !== 0)
      fail("Could not load the Supabase keys. Check the login and project ref.");
    let keys;
    try {
      keys = JSON.parse(result.stdout);
    } catch {
      fail("Unexpected answer from the Supabase CLI.");
    }
    if (!Array.isArray(keys)) keys = keys?.keys ?? [];
    const anon = pickKey(keys, "anon", "publishable");
    const service = pickKey(keys, "service_role", "secret");
    if (!anon || !service) fail("Supabase did not return both API keys.");
    save("NEXT_PUBLIC_SUPABASE_URL", `https://${ref}.supabase.co`);
    save("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
    save("SUPABASE_SERVICE_ROLE_KEY", service);
    console.log("Supabase URL and both keys saved (values not shown).");
    break;
  }
  case "push": {
    if (!args.length) fail("Name at least one variable.");
    const env = values();
    for (const name of args) {
      validName(name);
      if (!env[name]) fail(`${name} is missing in ${FILE}.`);
    }
    for (const name of args) {
      for (const target of ["production", "preview"]) {
        const result = run(
          "vercel",
          ["env", "add", name, target, "--force", "--yes"],
          env[name],
        );
        if (result.status !== 0) {
          // Never print CLI output here: it could echo the value.
          fail(`Vercel rejected ${name} for ${target}. Check login and link.`);
        }
      }
      console.log(`${name} is on Vercel (production, preview).`);
    }
    break;
  }
  case "unset": {
    const name = validName(args[0]);
    if (existsSync(FILE))
      write(
        read()
          .split(/\r?\n/)
          .filter((l) => !l.startsWith(`${name}=`))
          .join("\n"),
      );
    console.log(`${name} is removed from ${FILE}.`);
    break;
  }
  case "cloudflare-dns": {
    const [zone, type, recordName, content] = args;
    const host = /^[a-z0-9_]([a-z0-9_.-]*[a-z0-9])?$/i;
    if (!host.test(zone ?? "")) fail("Invalid zone.");
    if (type !== "A" && type !== "CNAME") fail("Type must be A or CNAME.");
    if (recordName !== "@" && !host.test(recordName ?? ""))
      fail("Invalid record name.");
    if (!host.test(content ?? "")) fail("Invalid record content.");
    const token = values().CLOUDFLARE_API_TOKEN;
    if (!token) fail(`CLOUDFLARE_API_TOKEN is missing in ${FILE}.`);
    const api = async (path, body) => {
      let json;
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4${path}`,
          {
            method: body ? "POST" : "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
          },
        );
        json = await response.json();
      } catch {
        fail("Could not reach Cloudflare. Check the token and connection.");
      }
      if (!json.success)
        fail(
          `Cloudflare refused: ${(json.errors ?? []).map((e) => e.message).join("; ") || "unknown error"}`,
        );
      return json.result;
    };
    const [found] = await api(`/zones?name=${encodeURIComponent(zone)}`);
    if (!found) fail(`The token has no access to ${zone}.`);
    const fullName =
      recordName === "@"
        ? zone
        : recordName === zone || recordName.endsWith(`.${zone}`)
          ? recordName
          : `${recordName}.${zone}`;
    const existing = await api(
      `/zones/${found.id}/dns_records?name=${encodeURIComponent(fullName)}`,
    );
    const conflicts = existing.filter((r) =>
      ["A", "AAAA", "CNAME"].includes(r.type),
    );
    if (conflicts.some((r) => r.type === type && r.content === content && !r.proxied)) {
      console.log(`${type} ${fullName} already exists.`);
    } else if (conflicts.length) {
      fail(
        `${fullName} already has records (${conflicts.map((r) => `${r.type} ${r.content}${r.proxied ? " proxied" : ""}`).join(", ")}). Nothing was changed.`,
      );
    } else {
      await api(`/zones/${found.id}/dns_records`, {
        type,
        name: fullName,
        content,
        proxied: false,
        ttl: 1,
      });
      console.log(`${type} ${fullName} created.`);
    }
    break;
  }
  case "open": {
    if (!existsSync(FILE)) fail(`${FILE} does not exist yet.`);
    const [cmd, cmdArgs] =
      process.platform === "darwin"
        ? ["open", ["-e", FILE]]
        : isWindows
          ? ["cmd", ["/c", "start", "notepad", FILE]]
          : ["xdg-open", [FILE]];
    const result = spawnSync(cmd, cmdArgs);
    if (result.status !== 0) fail(`Could not open ${FILE}.`);
    break;
  }
  default:
    fail("Unknown command. See the top of scripts/env-tool.mjs.");
}
