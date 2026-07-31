"use strict";

function getRecommendations(profile) {
  const notes = [];
  let whisperModel = "small";
  let maxConcurrentAgents = 3;
  let piperComfortable = true;

  if (profile.cpuCount <= 2) {
    whisperModel = "tiny";
    maxConcurrentAgents = 1;
    notes.push(
      `Only ${profile.cpuCount} CPU core(s) detected. Recommending the "tiny" ` +
      `Whisper model and limiting to 1 agent at a time — this machine doesn't ` +
      `have headroom for parallel work.`
    );
  } else if (profile.cpuCount <= 4) {
    whisperModel = "base";
    maxConcurrentAgents = 2;
  }

  if (profile.totalMemGB < 4) {
    piperComfortable = false;
    notes.push(
      `Total RAM is ${profile.totalMemGB}GB. Piper and Whisper both hold models ` +
      `in memory for the life of the process — expect this to be a meaningful ` +
      `share of available RAM. Close unnecessary apps before running JARVIS.`
    );
  } else if (profile.totalMemGB < 8) {
    notes.push(`${profile.totalMemGB}GB RAM is workable but tight with both voice models loaded.`);
  }

  if (!profile.hasCuda) {
    notes.push("No CUDA GPU detected — Whisper and any future vision models will run on CPU only.");
  }

  return {
    whisperModel,
    maxConcurrentAgents,
    piperComfortable,
    notes
  };
}

module.exports = {
  getRecommendations
};
