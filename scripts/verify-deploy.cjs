const { spawn } = require("child_process");

const previewPort = Number(process.env.PREVIEW_PORT || "4173");
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${previewPort}`;

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function waitForServer(url, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_) {
      // Ignore startup races while preview boots.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Preview server did not become ready at ${url}`);
}

async function run() {
  await runCommand("node", ["scripts/check-env.cjs"]);
  await runCommand("npm", ["run", "lint"]);
  await runCommand("npm", ["run", "test"]);
  await runCommand("npm", ["run", "build"]);

  const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort"], {
    stdio: "inherit",
    shell: true,
  });

  try {
    await waitForServer(baseUrl);
    await runCommand("npm", ["run", "test:e2e"], {
      env: { ...process.env, PLAYWRIGHT_TEST_BASE_URL: baseUrl },
    });
    await runCommand("node", ["scripts/responsive-check.cjs"], {
      env: { ...process.env, BASE_URL: baseUrl },
    });
    await runCommand("node", ["scripts/production-smoke.cjs"], {
      env: { ...process.env, BASE_URL: baseUrl },
    });
  } finally {
    preview.kill();
  }

  console.log(JSON.stringify({
    ok: true,
    checks: ["env", "lint", "test", "build", "test:e2e", "responsive-check", "production-smoke"],
    baseUrl,
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
