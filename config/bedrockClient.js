const { BedrockDataAutomationRuntimeClient } = require("@aws-sdk/client-bedrock-data-automation-runtime");

function createBedrockClient() {
    const {
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_SESSION_TOKEN,
        AWS_REGION
    } = process.env;

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_SESSION_TOKEN || !AWS_REGION) {
        throw new Error("Missing AWS credentials or region in environment variables.");
    }

    const config = {
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
            sessionToken: AWS_SESSION_TOKEN
        }
    };

    const client = new BedrockDataAutomationRuntimeClient(config);
    return client;
}

module.exports = { createBedrockClient };
