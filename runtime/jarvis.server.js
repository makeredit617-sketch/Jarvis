#!/usr/bin/env node
require("dotenv").config();

const { WebSocketServer } = require("ws");
const { bootJarvisRuntime } = require("../src/runtime/bootstrap");

const PORT = process.env.JARVIS_WS_PORT || 8787;

function summarizeResult(result) {
  // TODO: route conversational input (e.g. "say hello") to a lightweight
  // chat agent instead of always going through the Engineer/plan/execute
  // pipeline. Right now every request produces a structural summary,
  // even ones that were really just conversation. Candidate for the
  // multi-model/agent routing work in a later phase.

  if (result.status === "BLOCKED") {
    return `Blocked: ${result.securityDecision?.reason || "no reason given"}`;
  }

  const exec = result.executionResult || {};
  const parts = [];

  if (exec.errors && exec.errors.length > 0) {
    parts.push(`Errors: ${exec.errors.join("; ")}`);
  }
  if (exec.changes && exec.changes.length > 0) {
    const files = exec.changes.map((c) => c.file).join(", ");
    parts.push(`Created/modified: ${files}`);
  }
  if (exec.commands && exec.commands.length > 0) {
    parts.push(`Ran: ${exec.commands.join("; ")}`);
  }
  if (parts.length === 0) {
    parts.push(`Done (status: ${result.status})`);
  }
  if (result.qaResult && result.qaResult.status !== "PASS") {
    parts.push(`QA: ${result.qaResult.status}`);
  }

  return parts.join(" | ");
}

async function main() {
  const runtime = bootJarvisRuntime();
  await runtime.start();

  const wss = new WebSocketServer({ port: PORT });
  console.log(`JARVIS WebSocket server listening on ws://localhost:${PORT}`);

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "connection.state", connected: true }));

    ws.on("message", async (raw) => {
      let event;
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (event.type === "user.input") {
        ws.send(JSON.stringify({
          type: "activity.log",
          message: "Received command",
          detail: event.input
        }));
        ws.send(JSON.stringify({ type: "jarvis.state", state: "thinking" }));

        try {
          const result = await runtime.handleRequest({
            request: event.input,
            source: "frontend"
          });

          ws.send(JSON.stringify({
            type: "assistant.response",
            text: summarizeResult(result)
          }));
          ws.send(JSON.stringify({
            type: "activity.log",
            message: `Request completed (${result.status})`
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: "assistant.response",
            text: `Runtime error: ${error.message}`
          }));
          ws.send(JSON.stringify({
            type: "activity.log",
            message: "Request failed",
            detail: error.message
          }));
        } finally {
          ws.send(JSON.stringify({ type: "jarvis.state", state: "idle" }));
        }
      }

      if (event.type === "voice.toggle") {
        // Whisper isn't wired yet — this only reflects UI state for now.
        ws.send(JSON.stringify({
          type: "jarvis.state",
          state: event.listening ? "listening" : "idle"
        }));
      }
    });

    ws.on("close", () => {
      // Per-connection cleanup point if needed later.
    });
  });
}

main().catch((error) => {
  console.error("JARVIS server failed to start");
  console.error(error);
  process.exitCode = 1;
});
