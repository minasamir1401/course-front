const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const requiredServerFilesPath = path.join(projectRoot, ".next", "required-server-files.json");

function readRequiredServerFiles() {
  if (!fs.existsSync(requiredServerFilesPath)) {
    throw new Error(`Missing build metadata: ${requiredServerFilesPath}`);
  }

  return JSON.parse(fs.readFileSync(requiredServerFilesPath, "utf8"));
}

async function main() {
  const requiredServerFiles = readRequiredServerFiles();
  const nextConfig = requiredServerFiles.config;
  const { startServer } = require("next/dist/server/lib/start-server");

  process.env.NODE_ENV = "production";
  process.chdir(projectRoot);
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const hostname = process.env.HOSTNAME || "0.0.0.0";

  await startServer({
    dir: projectRoot,
    isDev: false,
    config: nextConfig,
    hostname,
    port,
    allowRetry: false,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
