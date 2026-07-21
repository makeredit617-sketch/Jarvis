"use strict";

/**
 * Capability Metadata Contract
 *
 * Every capability registered in JARVIS
 * must satisfy this contract.
 */

function validateCapability(capability) {

    if (!capability || typeof capability !== "object") {
        throw new TypeError("Capability must be an object.");
    }

    if (!capability.id) {
        throw new Error("Capability requires an id.");
    }

    if (!capability.version) {
        throw new Error("Capability requires a version.");
    }

    if (!capability.status) {
        throw new Error("Capability requires a status.");
    }

    return capability;
}

module.exports = {
    validateCapability
};
