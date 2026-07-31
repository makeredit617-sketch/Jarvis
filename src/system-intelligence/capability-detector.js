"use strict";

function detectCapabilities(profile) {
  const whisper = {
    tiny: true,
    base: profile.cpuCount >= 4 && profile.totalMemGB >= 4,
    small: profile.cpuCount >= 6 && profile.totalMemGB >= 8,
    medium: profile.cpuCount >= 8 && profile.totalMemGB >= 16,
    large: profile.hasCuda && profile.totalMemGB >= 32
  };

  return {
    whisper,

    piper: profile.totalMemGB >= 2,

    cuda: profile.hasCuda,

    vision: profile.hasCuda && profile.totalMemGB >= 8,

    maxRecommendedAgents:
      profile.cpuCount <= 2 ? 1 :
      profile.cpuCount <= 4 ? 2 :
      3,

    supportedFeatures: [
      "voice-input",
      "voice-output",
      "tool-execution"
    ]
  };
}

module.exports = {
  detectCapabilities
};
