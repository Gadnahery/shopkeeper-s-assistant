const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env");

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()];
      })
  );
}

function run() {
  const envFile = loadEnvFile();
  const projectRef = process.env.SUPABASE_PROJECT_REF || envFile.SUPABASE_PROJECT_REF;

  if (!projectRef || /^your-/i.test(projectRef)) {
    throw new Error("Set SUPABASE_PROJECT_REF in your environment or .env before running npm run supabase:link.");
  }

  const result = spawnSync("npx", ["supabase", "link", "--project-ref", projectRef], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
