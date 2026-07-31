"use strict";

function yn(value) {
  return value ? "✓ Yes" : "✖ No";
}

function formatSystemIntelligence(system) {
  const { hardware, capabilities, runtimeProfile, recommendations } = system;

  return `
══════════════════════════════════════════════════════

           JARVIS SYSTEM INTELLIGENCE

══════════════════════════════════════════════════════

Hardware
──────────────────────────────────────────────────────
Platform           ${hardware.platform}
CPU Cores          ${hardware.cpuCount}
RAM                ${hardware.totalMemGB} GB
Available RAM      ${hardware.freeMemGB} GB
CUDA               ${yn(hardware.hasCuda)}

Capabilities
──────────────────────────────────────────────────────
Whisper Tiny       ${yn(capabilities.whisper.tiny)}
Whisper Base       ${yn(capabilities.whisper.base)}
Whisper Small      ${yn(capabilities.whisper.small)}
Piper              ${yn(capabilities.piper)}
Vision             ${yn(capabilities.vision)}
Python             ✓ Yes
Git                ✓ Yes

Runtime Profile
──────────────────────────────────────────────────────
Mode               ${runtimeProfile.runtime}
Inference          ${runtimeProfile.cpuInference ? "CPU" : "CUDA"}
Max Agents         ${runtimeProfile.maxConcurrentAgents}
Preferred Whisper  ${runtimeProfile.preferredWhisperModel}

Recommendations
──────────────────────────────────────────────────────
${recommendations.notes.map(n => `• ${n}`).join("\n")}

══════════════════════════════════════════════════════
`.trim();
}

module.exports = {
  formatSystemIntelligence
};
