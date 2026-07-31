"use strict";

function buildRuntimeProfile(profile, capabilities) {
  let runtime = "HIGH_PERFORMANCE";

  if (profile.cpuCount <= 2 || profile.totalMemGB < 4) {
    runtime = "LIGHTWEIGHT";
  } else if (profile.cpuCount <= 4 || profile.totalMemGB < 8) {
    runtime = "BALANCED";
  }

  return {
    runtime,

    preferredWhisperModel:
      runtime === "LIGHTWEIGHT"
        ? "tiny"
        : runtime === "BALANCED"
        ? "base"
        : "small",

    maxConcurrentAgents: capabilities.maxRecommendedAgents,

    cpuInference: !capabilities.cuda,

    persistentVoiceModels: capabilities.piper
  };
}

module.exports = {
  buildRuntimeProfile
};
