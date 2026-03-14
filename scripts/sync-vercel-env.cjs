const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const envPath = path.resolve(process.cwd(), ".env");
const requiredVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_VAPID_PUBLIC_KEY",
  "VITE_SUBSCRIPTION_MONTHLY_PRICE_TZS",
];
const targets = ["production", "development"];
const scope = process.env.VERCEL_SCOPE || "gadnaherys-projects";
const previewBranch = process.env.VERCEL_PREVIEW_BRANCH;

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env file. Create it before syncing Vercel environment variables.");
  }

  const entries = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const separatorIndex = trimmed.indexOf("=");
    entries[trimmed.slice(0, separatorIndex).trim()] = trimmed.slice(separatorIndex + 1).trim();
  }

  return entries;
}

function runVercel(args, input = "") {
  const result = spawnSync("npx", ["vercel", ...args], {
    input,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: npx vercel ${args.join(" ")}`);
  }
}

function main() {
  const env = loadEnvFile();

  for (const key of requiredVars) {
    const value = env[key];
    if (!value) {
      throw new Error(`Missing ${key} in .env`);
    }

    for (const target of targets) {
      runVercel(["env", "add", key, target, "--value", value, "--yes", "--force", "--scope", scope]);
    }

    if (previewBranch) {
      runVercel(["env", "add", key, "preview", previewBranch, "--value", value, "--yes", "--force", "--scope", scope]);
    }
  }

  console.log(JSON.stringify({
    ok: true,
    synced: requiredVars,
    targets: previewBranch ? [...targets, `preview:${previewBranch}`] : targets,
    scope,
    previewBranch: previewBranch || null,
    note: previewBranch ? "Preview variables were synced for the configured preview branch." : "Set VERCEL_PREVIEW_BRANCH to sync branch-specific preview variables.",
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
