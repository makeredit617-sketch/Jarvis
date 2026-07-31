"use strict";

function getRecommendations(hardware, runtimeProfile) {
  const notes = [];

  if (runtimeProfile.runtime === "LIGHTWEIGHT") {
    notes.push(
      `Only ${hardware.cpuCount} CPU core(s) detected. ` +
      `Running in LIGHTWEIGHT mode with reduced concurrency.`
    );
  } else if (runtimeProfile.runtime === "BALANCED") {
    notes.push(
      "Running in BALANCED mode. Moderate parallelism is recommended."
    );
  } else {
    notes.push(
      "Running in HIGH_PERFORMANCE mode."
    );
  }

  if (hardware.totalMemGB < 4) {
    notes.push(
      `Total RAM is ${hardware.totalMemGB}GB. Piper and Whisper both hold models ` +
      `in memory for the life of the process — keep unnecessary applications closed.`
    );
  } else if (hardware.totalMemGB < 8) {
    notes.push(
      `${hardware.totalMemGB}GB RAM is workable but may become tight with multiple AI models.`
    );
  }

  if (!hardware.hasCuda) {
    notes.push(
      "No CUDA GPU detected — AI inference will run on CPU."
    );
  }

  return {
    whisperModel: runtimeProfile.preferredWhisperModel,
    maxConcurrentAgents: runtimeProfile.maxConcurrentAgents,
    piperComfortable: runtimeProfile.persistentVoiceModels,
    notes
  };
}

module.exports = {
  getRecommendations
};
