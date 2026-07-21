"use strict";

const { validateCapability } = require("./capability.types");

function createCapabilityRegistry() {
    const capabilities = new Map();

    return {
        register(capability) {
            validateCapability(capability);
            capabilities.set(capability.id, capability);
        },

        get(id) {
            return capabilities.get(id);
        },

        remove(id) {
            return capabilities.delete(id);
        },

        list() {
            return [...capabilities.values()];
        }
    };
}

module.exports = {
    createCapabilityRegistry
};
