const { BedrockDataAutomationRuntimeClient } = require("@aws-sdk/client-bedrock-data-automation-runtime");

function createBedrockClient() {
    const {
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        REGION
    } = process.env;

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !REGION) {
        throw new Error("Missing AWS credentials or region in environment variables.");
    }

    const config = {
        region: REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
      
        }
    };

    const client = new BedrockDataAutomationRuntimeClient(config);
    return client;
}

module.exports = { createBedrockClient };
