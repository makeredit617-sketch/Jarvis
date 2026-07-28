#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const { bootJarvisRuntime } = require("../src/runtime/bootstrap");
const { createWhisperProvider } = require("../src/communication/providers/whisper-provider");
const { createPiperClient } = require("../src/tts/piper-client");

const PORT = process.env.JARVIS_WS_PORT || 8787;
const AUDIO_TMP_DIR = path.join(__dirname, "..", "workspace", ".audio-tmp");

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

  if (exec.reply) {
    return exec.reply;
  }

  const parts = [];

  if (exec.changes && exec.changes.length > 0) {
    const succeeded = exec.changes.filter((c) => c.success).map((c) => c.file);
    const failed = exec.changes.filter((c) => !c.success).map((c) => c.file);
    if (succeeded.length > 0) {
      parts.push(`Created/modified: ${succeeded.join(", ")}`);
    }
    if (failed.length > 0) {
      parts.push(`Failed to write: ${failed.join(", ")}`);
    }
  }
  if (exec.commands && exec.commands.length > 0) {
    parts.push(`Ran: ${exec.commands.join("; ")}`);
  }
  if (exec.errors && exec.errors.length > 0) {
    parts.push(`Errors: ${exec.errors.join("; ")}`);
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

  fs.mkdirSync(AUDIO_TMP_DIR, { recursive: true });

  const whisperProvider = createWhisperProvider({
    id: "whisper-local",
    pythonPath: process.env.WHISPER_PYTHON || "python3",
    scriptPath: path.join(__dirname, "..", "python", "transcribe_server.py")
  });

  console.log("Starting Whisper provider (this may take a moment on first run)...");
  try {
    await whisperProvider.initialize();
    console.log("Whisper provider ready.");
  } catch (error) {
    console.error("Whisper provider failed to start:", error.message);
    console.error("Voice input will not work this session. Text input is unaffected.");
  }

  const piperClient = createPiperClient({
    pythonPath: process.env.WHISPER_PYTHON || "python3",
    scriptPath: path.join(__dirname, "..", "python", "speak_server.py")
  });

  console.log("Starting Piper voice server (this may take a moment on first run)...");
  try {
    await piperClient.initialize();
    console.log("Piper voice server ready.");
  } catch (error) {
    console.error("Piper voice server failed to start:", error.message);
    console.error("Voice output will not work this session. Text/chat is unaffected.");
  }

  function speakViaPiper(text) {
    piperClient.speak(text).catch((error) => {
      console.error("Piper speak failed:", error.message);
    });
  }

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

          const responseText = summarizeResult(result);
          ws.send(JSON.stringify({
            type: "assistant.response",
            text: responseText
          }));
          speakViaPiper(responseText);
          ws.send(JSON.stringify({
            type: "activity.log",
            message: `Request completed (${result.status})`
          }));
        } catch (error) {
          const errorText = `Runtime error: ${error.message}`;
          ws.send(JSON.stringify({
            type: "assistant.response",
            text: errorText
          }));
          speakViaPiper(errorText);
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
        ws.send(JSON.stringify({
          type: "jarvis.state",
          state: event.listening ? "listening" : "idle"
        }));
      }

      if (event.type === "audio.chunk") {
        if (!ws.audioChunks) ws.audioChunks = [];
        ws.audioChunks.push(Buffer.from(event.data, "base64"));
      }

      if (event.type === "audio.end") {
        const chunks = ws.audioChunks || [];
        ws.audioChunks = [];

        if (chunks.length === 0) {
          ws.send(JSON.stringify({
            type: "activity.log",
            message: "No audio received"
          }));
          return;
        }

        const audioPath = path.join(AUDIO_TMP_DIR, `${Date.now()}.webm`);
        fs.writeFileSync(audioPath, Buffer.concat(chunks));

        ws.send(JSON.stringify({ type: "jarvis.state", state: "thinking" }));
        ws.send(JSON.stringify({
          type: "activity.log",
          message: "Transcribing audio..."
        }));

        try {
          const transcribedText = await whisperProvider.transcribe(audioPath);

          ws.send(JSON.stringify({
            type: "activity.log",
            message: "Transcribed",
            detail: transcribedText
          }));

          if (!transcribedText || !transcribedText.trim()) {
            const noSpeechText = "I did not catch any speech in that recording.";
            ws.send(JSON.stringify({
              type: "assistant.response",
              text: noSpeechText
            }));
            speakViaPiper(noSpeechText);
            ws.send(JSON.stringify({ type: "jarvis.state", state: "idle" }));
            return;
          }

          const result = await runtime.handleRequest({
            request: transcribedText,
            source: "voice"
          });

          const voiceResponseText = summarizeResult(result);
          ws.send(JSON.stringify({
            type: "assistant.response",
            text: voiceResponseText
          }));
          speakViaPiper(voiceResponseText);
          ws.send(JSON.stringify({
            type: "activity.log",
            message: `Voice request completed (${result.status})`
          }));
        } catch (error) {
          const transcriptionErrorText = `Transcription error: ${error.message}`;
          ws.send(JSON.stringify({
            type: "assistant.response",
            text: transcriptionErrorText
          }));
          speakViaPiper(transcriptionErrorText);
        } finally {
          ws.send(JSON.stringify({ type: "jarvis.state", state: "idle" }));
          fs.unlink(audioPath, () => {});
        }
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
