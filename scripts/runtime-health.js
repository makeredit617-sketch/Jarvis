"use strict";

const { bootJarvisRuntime } = require("../src/runtime/bootstrap");

(async () => {
    console.log("\n==============================");
    console.log(" JARVIS Runtime Health Check");
    console.log("==============================\n");

    try {
        const runtime = bootJarvisRuntime();
        await runtime.start();

        const checks = [
            ["AI Service", runtime.services.get("ai")],
            ["Event Bus", runtime.services.get("eventBus")],
            ["Memory Store", runtime.services.get("memoryStore")],
            ["Tool Registry", runtime.services.get("toolRegistry")],
            ["Capability Registry", runtime.services.get("capabilityRegistry")],
            ["Capability Manager", runtime.services.get("capabilityManager")],
            ["Audit Log", runtime.services.get("auditLog")],
            ["Architecture Docs", runtime.services.get("architectureDocs")]
        ];

        let passed = 0;

        for (const [name, service] of checks) {
            if (service) {
                console.log("✅", name);
                passed++;
            } else {
                console.log("❌", name);
            }
        }

        await runtime.shutdown();

        console.log("\n------------------------------");
        console.log(`Passed ${passed}/${checks.length} checks`);

        if (passed === checks.length) {
            console.log("🎉 Runtime Healthy");
        } else {
            console.log("⚠ Runtime requires attention");
        }

        console.log("------------------------------\n");

    } catch (err) {
        console.error("\n❌ Runtime Health Check Failed\n");
        console.error(err);
        process.exit(1);
    }
})();
