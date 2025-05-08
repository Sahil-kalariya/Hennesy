const { BedrockDataAutomationRuntimeClient, InvokeDataAutomationAsyncCommand, GetDataAutomationStatusCommand } = require("@aws-sdk/client-bedrock-data-automation-runtime");

const analyzeFile = async (req, res) => {
    try {
        // Get credentials from environment variables
        const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
        const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
        const AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;
        const REGION = process.env.REGION || "us-east-1"; // Default to us-east-1 if not specified
        const DATA_AUTOMATION_PROFILE_ARN = process.env.DATA_AUTOMATION_PROFILE_ARN;

        const config = {
            region: REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
                sessionToken: AWS_SESSION_TOKEN // This is optional, so we include it as is
            }
        };

        const client = new BedrockDataAutomationRuntimeClient(config);

        // You need to replace these placeholder values with actual ARNs
        const input = {
            inputConfiguration: {
                s3Uri: "s3://bda-input-bucket-9876/Used_Car_Trade.pdf",
            },
            outputConfiguration: {
                s3Uri: "s3://bda-output-9876/output/",
            },
            blueprints: [
                {
                    blueprintArn: "arn:aws:bedrock:us-east-1:943143228843:blueprint/4b2f9dea25d4",
                    version: "1",
                    stage: "LIVE",
                },
            ],
            dataAutomationProfileArn: DATA_AUTOMATION_PROFILE_ARN
        };

        // Invoke the data automation job
        const invokeCommand = new InvokeDataAutomationAsyncCommand(input);
        const invokeResponse = await client.send(invokeCommand);
        
        console.log("BDA API Response (Invocation):", invokeResponse);
        
        // Get the invocation ARN from the response
        const invocationArn = invokeResponse.invocationArn;
        
        // Helper function to check status
        const checkStatus = async () => {
            const statusInput = { 
                invocationArn: invocationArn 
            };
            
            const statusCommand = new GetDataAutomationStatusCommand(statusInput);
            return client.send(statusCommand);
        };
        
        // Function to wait for job completion with polling
        const waitForCompletion = async (maxAttempts = 30, intervalSeconds = 5) => {
            console.log(`Waiting for job completion. Checking status every ${intervalSeconds} seconds...`);
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Get current status
                const statusResponse = await checkStatus();
                console.log(`Attempt ${attempt + 1}/${maxAttempts}: Status = ${statusResponse.status}`);
                
                if (statusResponse.status === "Success") {
                    console.log("Job completed successfully!");
                    return {
                        statusResponse
                    };
                }
                
                // Check if job failed
                if (statusResponse.status === "FAILED") {
                    console.error("Job failed:", statusResponse.failureReason);
                    throw new Error(`Job failed: ${JSON.stringify(statusResponse.failureReason)}`);
                }
                
                // Wait before checking again
                console.log(`Status is ${statusResponse.status}. Waiting ${intervalSeconds} seconds before checking again...`);
                await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
            }
            
            throw new Error(`Job did not complete within the timeout period (${maxAttempts * intervalSeconds} seconds)`);
        };
        
        // Wait for the job to complete
        try {
            const completionResult = await waitForCompletion();
            
            // Job completed successfully, return the results
            return res.status(200).json({
                message: "Data automation job completed successfully",
                invocationArn: invocationArn,
                result: completionResult
            });
        } catch (pollingError) {
            console.error("Error while waiting for job completion:", pollingError);
            return res.status(500).json({
                message: "Error while waiting for job completion",
                error: pollingError.message,
                invocationArn: invocationArn
            });
        }

    } catch (error) {
        console.error(`Error in analyze controller: ${error}`);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


module.exports = { analyzeFile };