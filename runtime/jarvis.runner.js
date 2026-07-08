#!/usr/bin/env node
require("dotenv").config();

const { bootJarvisRuntime } = require("../src/runtime/bootstrap");

async function main() {
  const request = process.argv.slice(2).join(" ").trim();
  const runtime = bootJarvisRuntime();

  await runtime.start();

  try {
    const result = await runtime.handleRequest({
      request: request || "No request provided",
      source: "cli"
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await runtime.shutdown();
  }
}

main().catch(error => {
  console.error("JARVIS runtime failed to start");
  console.error(error);
  process.exitCode = 1;
});
