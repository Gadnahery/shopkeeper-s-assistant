const fs = require("fs");
const path = require("path");

function readEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()];
      }),
  );
}

function readProjectRef() {
  const configPath = path.resolve(process.cwd(), "supabase", "config.toml");
  if (!fs.existsSync(configPath)) return "";
  const content = fs.readFileSync(configPath, "utf8");
  const match = content.match(/project_id\s*=\s*"([^"]+)"/);
  return match ? match[1] : "";
}

async function request(method, url, token, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${url} failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function run() {
  const envFile = readEnvFile();
  const env = { ...envFile, ...process.env };
  const accessToken = env.SUPABASE_ACCESS_TOKEN;
  const projectRef = env.SUPABASE_PROJECT_REF || readProjectRef();

  if (!accessToken) {
    throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  }
  if (!projectRef) {
    throw new Error("SUPABASE project ref was not found.");
  }

  const current = await request("GET", `https://api.supabase.com/v1/projects/${projectRef}/config/auth`, accessToken);
  const payload = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    payload.external_google_enabled = true;
    payload.external_google_client_id = env.GOOGLE_CLIENT_ID;
    payload.external_google_secret = env.GOOGLE_CLIENT_SECRET;
  }

  const smtpFields = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_ADMIN_EMAIL",
    "SMTP_SENDER_NAME",
  ];

  if (smtpFields.every((field) => env[field])) {
    payload.smtp_host = env.SMTP_HOST;
    payload.smtp_port = Number(env.SMTP_PORT);
    payload.smtp_user = env.SMTP_USER;
    payload.smtp_pass = env.SMTP_PASS;
    payload.smtp_admin_email = env.SMTP_ADMIN_EMAIL;
    payload.smtp_sender_name = env.SMTP_SENDER_NAME;
    payload.rate_limit_email_sent = Number(env.SUPABASE_RATE_LIMIT_EMAIL_SENT || 10);
  }

  if (Object.keys(payload).length === 0) {
    console.log(JSON.stringify({
      projectRef,
      googleConfigured: Boolean(current.external_google_enabled),
      smtpConfigured: Boolean(current.smtp_host),
      rateLimitEmailSent: current.rate_limit_email_sent,
      note: "No GOOGLE_* or SMTP_* env vars were present, so nothing was changed.",
    }, null, 2));
    return;
  }

  const updated = await request("PATCH", `https://api.supabase.com/v1/projects/${projectRef}/config/auth`, accessToken, payload);

  console.log(JSON.stringify({
    projectRef,
    payloadKeys: Object.keys(payload),
    googleConfigured: Boolean(updated.external_google_enabled),
    smtpConfigured: Boolean(updated.smtp_host),
    rateLimitEmailSent: updated.rate_limit_email_sent,
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
