"use strict";

const { spawn } = require("child_process");
const path = require("path");
const { randomUUID } = require("crypto");

/**
 * Whisper Provider
 *
 * Manages a persistent Python subprocess (faster-whisper) for real
 * speech-to-text transcription. The model loads once at startup, not
 * per request, so repeated commands stay fast after the first one.
 */
function createWhisperProvider(options = {}) {
  const { id, pythonPath = "python3", scriptPath, env = {} } = options;

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
      pending.resolve(message.text);
    }
  }

  return {
    get id() {
      return id;
    },

    initialize() {
      return new Promise((resolve, reject) => {
        child = spawn(pythonPath, [scriptPath], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env, ...env }
        });

        child.stdout.on("data", (chunk) => {
          stdoutBuffer += chunk.toString();
          const lines = stdoutBuffer.split("\n");
          stdoutBuffer = lines.pop();
          lines.forEach(handleLine);
        });

        child.stderr.on("data", () => {
          // Model download/progress noise goes here; not surfaced as errors.
        });

        child.on("error", (error) => {
          reject(new Error(`Whisper process failed to start: ${error.message}`));
        });

        child.on("exit", (code) => {
          if (!ready) {
            reject(new Error(`Whisper process exited before becoming ready (code ${code})`));
          }
          ready = false;
        });

        readyResolvers.push(resolve);
      });
    },

    start() {
      if (!ready) {
        throw new Error("Whisper provider is not initialized.");
      }
      return Promise.resolve();
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
    },

    transcribe(audioPath) {
      if (!ready || !child) {
        return Promise.reject(new Error("Whisper provider is not ready."));
      }

      const requestId = randomUUID();

      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });
        child.stdin.write(JSON.stringify({ id: requestId, audioPath }) + "\n");
      });
    }
  };
}

module.exports = {
  createWhisperProvider
};
