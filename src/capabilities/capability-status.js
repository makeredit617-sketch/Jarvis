"use strict";

const CapabilityStatus = Object.freeze({
    DISCOVERED: "DISCOVERED",
    INSTALLING: "INSTALLING",
    READY: "READY",
    UPDATING: "UPDATING",
    FAILED: "FAILED",
    REMOVED: "REMOVED"
});

module.exports = {
    CapabilityStatus
};
