"use strict";

/**
 * Voice Type Constants
 *
 * Stable constants for future voice infrastructure contracts.
 */

const VoiceInputMode = Object.freeze({
  PUSH_TO_TALK: "PUSH_TO_TALK",
  CONTINUOUS: "CONTINUOUS",
  WAKE_WORD: "WAKE_WORD"
});

const VoiceSessionStatus = Object.freeze({
  IDLE: "IDLE",
  STARTING: "STARTING",
  ACTIVE: "ACTIVE",
  STOPPING: "STOPPING",
  STOPPED: "STOPPED",
  FAILED: "FAILED"
});

module.exports = {
  VoiceInputMode,
  VoiceSessionStatus
};
