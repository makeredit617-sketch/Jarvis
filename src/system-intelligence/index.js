"use strict";

const { getHardwareProfile } = require("./hardware-profile");
const { detectCapabilities } = require("./capability-detector");
const { buildRuntimeProfile } = require("./runtime-profile");
const { getRecommendations } = require("./recommendations");

function createSystemIntelligence() {
  const hardware = getHardwareProfile();
  const capabilities = detectCapabilities(hardware);
  const runtimeProfile = buildRuntimeProfile(hardware, capabilities);
  const recommendations = getRecommendations(hardware, runtimeProfile);

  return {
    hardware,
    capabilities,
    runtimeProfile,
    recommendations
  };
}

module.exports = {
  createSystemIntelligence
};
