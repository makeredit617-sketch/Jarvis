"use strict";

/**
 * Communication Provider Type Constants
 *
 * Stable constants for provider categories and lifecycle states. These values
 * describe contracts only and do not imply provider availability.
 */

const CommunicationProviderType = Object.freeze({
  SPEECH_TO_TEXT: "SPEECH_TO_TEXT",
  TEXT_TO_SPEECH: "TEXT_TO_SPEECH",
  MULTIMODAL: "MULTIMODAL",
  GENERIC: "GENERIC"
});

const CommunicationProviderStatus = Object.freeze({
  DISCOVERED: "DISCOVERED",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  ACTIVE: "ACTIVE",
  STOPPED: "STOPPED",
  FAILED: "FAILED"
});

module.exports = {
  CommunicationProviderStatus,
  CommunicationProviderType
};
