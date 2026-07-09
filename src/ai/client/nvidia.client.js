class NvidiaClient {
    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.baseUrl = process.env.NVIDIA_BASE_URL;
        this.model = process.env.NVIDIA_MODEL;
    }

    healthCheck() {
        return {
            apiKey: !!this.apiKey,
            baseUrl: !!this.baseUrl,
            model: !!this.model
        };
    }

    async generate(prompt) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: {
                    type: "json_object"
                },
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            throw new Error(`NVIDIA API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return data.choices[0].message.content;
    }
}

module.exports = { NvidiaClient };
