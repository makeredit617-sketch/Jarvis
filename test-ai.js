require("dotenv").config();

const { NvidiaClient } = require("./src/ai/client/nvidia.client");

async function main() {
    const client = new NvidiaClient();

    console.log("Health Check:");
    console.log(client.healthCheck());

    console.log("\nTalking to NVIDIA AI...\n");

    const reply = await client.generate(`You are the JARVIS Planner Agent. Return ONLY valid JSON with this exact structure: {"id":"plan-001","request":"...","steps":["..."],"dependencies":[],"riskLevel":"LOW"}. Generate a plan for the following request: Create a Python calculator application.`);

    console.log("AI Reply:");
    console.log(reply);
}

main().catch(console.error);
