"use strict";

const os = require("os");
const { execSync } = require("child_process");

function detectCuda() {
  try {
    execSync("nvidia-smi", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getHardwareProfile() {
  const cpuCount = os.cpus().length;
  const totalMemGB = Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10;
  const freeMemGB = Math.round((os.freemem() / 1024 / 1024 / 1024) * 10) / 10;
  const hasCuda = detectCuda();

  return {
    cpuCount,
    totalMemGB,
    freeMemGB,
    hasCuda,
    platform: os.platform()
  };
}

module.exports = {
  getHardwareProfile
};
