"use strict";

const { spawn } = require("child_process");
const { randomUUID } = require("crypto");

function createPiperClient({ pythonPath = "python3", scriptPath }) {
  let child = null;
  let ready = false;
  let readyResolvers = [];
  const pendingRequests = new Map();
  let stdoutBuffer = "";

  function handleLine(line) {
    if (!line.trim()) return;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }

    if (message.type === "ready") {
      ready = true;
      readyResolvers.forEach((resolve) => resolve());
      readyResolvers = [];
      return;
    }

    const pending = pendingRequests.get(message.id);
    if (!pending) return;
    pendingRequests.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error));
    } else {
      pending.resolve();
    }
  }

  return {
    initialize() {
      return new Promise((resolve, reject) => {
        child = spawn(pythonPath, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

        child.stdout.on("data", (chunk) => {
          stdoutBuffer += chunk.toString();
          const lines = stdoutBuffer.split("\n");
          stdoutBuffer = lines.pop();
          lines.forEach(handleLine);
        });

        child.stderr.on("data", () => {});

        child.on("error", (error) => {
          reject(new Error(`Piper process failed to start: ${error.message}`));
        });

        child.on("exit", (code) => {
          if (!ready) {
            reject(new Error(`Piper process exited before becoming ready (code ${code})`));
          }
          ready = false;
        });

        readyResolvers.push(resolve);
      });
    },

    speak(text) {
      if (!ready || !child || !text) {
        return Promise.resolve();
      }

      const requestId = randomUUID();

      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });
        child.stdin.write(JSON.stringify({ id: requestId, text }) + "\n");
      });
    },

    stop() {
      return new Promise((resolve) => {
        if (child) {
          child.once("exit", () => resolve());
          child.kill();
        } else {
          resolve();
        }
      });
    }
  };
}

module.exports = {
  createPiperClient
};
