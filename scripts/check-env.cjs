const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env");
const requiredVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const placeholderPatterns = [
  /^https:\/\/your-project\.supabase\.co$/i,
  /^your-/i,
  /^placeholder$/i,
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function isPlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(value));
}

function resolveValue(key, fileValues) {
  return process.env[key] || fileValues[key] || "";
}

function run() {
  const fileValues = loadEnvFile(envPath);
  const missing = [];
  const placeholders = [];

  for (const key of requiredVars) {
    const value = resolveValue(key, fileValues);
    if (!value) {
      missing.push(key);
      continue;
    }

    if (isPlaceholder(value)) {
      placeholders.push(key);
    }
  }

  if (missing.length || placeholders.length) {
    const issues = [];
    if (missing.length) issues.push(`Missing: ${missing.join(", ")}`);
    if (placeholders.length) issues.push(`Placeholder values: ${placeholders.join(", ")}`);

    throw new Error(`Environment validation failed. ${issues.join(". ")}.`);
  }

  console.log(JSON.stringify({
    ok: true,
    validated: requiredVars,
    source: fs.existsSync(envPath) ? ".env and process.env" : "process.env",
  }, null, 2));
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
