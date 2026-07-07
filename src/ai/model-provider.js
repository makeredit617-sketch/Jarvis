class ModelProvider {
    constructor(name) {
        this.name = name;
    }

    async generate(request) {
        throw new Error("generate() not implemented");
    }

    async healthCheck() {
        throw new Error("healthCheck() not implemented");
    }
}

module.exports = ModelProvider;
