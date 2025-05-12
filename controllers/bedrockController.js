const { createBedrockClient } = require("../config/bedrockClient");
const { 
  InvokeDataAutomationAsyncCommand, 
  GetDataAutomationStatusCommand 
} = require("@aws-sdk/client-bedrock-data-automation-runtime");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

/**
 * Configure input for the Bedrock Data Automation job
 * @returns {Object} Job input configuration
 */

const getJobInput = (s3url,id) => {
  let Blueprint;
  console.log(id);
  
  const DATA_AUTOMATION_PROFILE_ARN = process.env.DATA_AUTOMATION_PROFILE_ARN;
  console.log("Using Data Automation Profile:", DATA_AUTOMATION_PROFILE_ARN);
  if(id==='1'){
    Blueprint= {
      blueprintArn: "arn:aws:bedrock:us-east-1:943143228843:blueprint/4b2f9dea25d4",
      version: "2",
      stage: "LIVE",
    }
  }
  if(id==='2'){
    Blueprint= {
      blueprintArn: "arn:aws:bedrock:us-east-1:943143228843:blueprint/cfded66e2534",
      version: "2",
      stage: "LIVE",
    }
  }
  console.log(Blueprint)
  return {
    inputConfiguration: {
      s3Uri: s3url,
    },
    outputConfiguration: {
      s3Uri: "s3://bda-output-9876/output/",
    },
    blueprints:[Blueprint],
    dataAutomationProfileArn: DATA_AUTOMATION_PROFILE_ARN
  };
};

/**
 * Analyze a file using AWS Bedrock Data Automation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with job status and results
 */
const analyzeFile = async (req, res,next) => {
  let paramId;
  paramId=req.params.id
  console.log(paramId);
  
  try {
    // Initialize client and job input
    const client = createBedrockClient();
    const input = getJobInput(req.S3url,paramId);
    console.log(input)
    // Start the data automation job
    console.log("Starting data automation job...");
    const invokeCommand = new InvokeDataAutomationAsyncCommand(input);
    const invokeResponse = await client.send(invokeCommand);
    console.log("Job invocation successful:", invokeResponse);
    
    const invocationArn = invokeResponse.invocationArn;
    
    try {
      // Wait for the job to complete
      const completionResult = await waitForJobCompletion(client, invocationArn);
      
      // Get the result S3 URI
      const resultS3Uri = completionResult.resultS3Uri;
      console.log(`Got result S3 URI: ${resultS3Uri}`);
      
      // Return the info even if we can't fetch the actual result
    
      // Fetch the actual result content from S3
      try {
        resultContent = await fetchResultFromS3(resultS3Uri);
        console.log("Successfully fetched result from S3");
        req.extractedData=resultContent
        // return res.status(200).json({
        //   message: "Data automation job completed successfully",
        //   result: resultContent
        // });
        next();
      } catch (s3Error) {
        console.error("Error fetching result from S3:", s3Error);
        
        // Return what we have even if S3 fetch failed
        return res.status(200).json({
          message: "Data automation job completed, but couldn't fetch result data",
          invocationArn: invocationArn,
          s3ResultUri: resultS3Uri,
          outputConfiguration: completionResult.statusResponse.outputConfiguration,
          s3Error: s3Error.message
        });
      }
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
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

/**
 * Check the status of a data automation job
 * @param {Object} client - Bedrock client
 * @param {string} invocationArn - ARN of the invocation to check
 * @returns {Promise<Object>} Status response
 */
const checkJobStatus = async (client, invocationArn) => {
  const statusInput = { invocationArn };
  const statusCommand = new GetDataAutomationStatusCommand(statusInput);
  return client.send(statusCommand);
};

/**
 * Wait for job completion with polling
 * @param {Object} client - Bedrock client
 * @param {string} invocationArn - ARN of the invocation to monitor
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} intervalSeconds - Polling interval in seconds
 * @returns {Promise<Object>} Job completion result
 */
const waitForJobCompletion = async (client, invocationArn, maxAttempts = 30, intervalSeconds = 10) => {
  console.log(`Waiting for job completion. Checking status every ${intervalSeconds} seconds...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get current status
    const statusResponse = await checkJobStatus(client, invocationArn);
    console.log(`Attempt ${attempt + 1}/${maxAttempts}: Status = ${statusResponse.status}`);
    
    if (statusResponse.status === "Success") {
      console.log("Job completed successfully!");
      // Extract and modify the S3 URI for result.json
      const resultS3Uri = getResultJsonUri(statusResponse.outputConfiguration.s3Uri);
      return { 
        statusResponse,
        resultS3Uri
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

/**
 * Extracts and modifies S3 URI to point to the result.json file
 * @param {string} originalUri - Original S3 URI pointing to job_metadata.json
 * @returns {string} Modified S3 URI pointing to result.json
 */
const getResultJsonUri = (originalUri) => {
  // Log original URI for debugging
  console.log(`Original S3 URI: ${originalUri}`);
  
  try {
    // Extract the path without job_metadata.json
    let basePath;
    
    if (originalUri.endsWith('job_metadata.json')) {
      // Remove the filename
      basePath = originalUri.substring(0, originalUri.lastIndexOf('job_metadata.json'));
    } else {
      // If it doesn't end with the expected file, just use the URI as is
      basePath = originalUri;
      if (!basePath.endsWith('/')) {
        basePath += '/';
      }
    }
    
    // Fix any duplicate slashes, preserving s3:// at the beginning
    // let normalizedPath = basePath.replace(/([^:])\/\/+/g, '$1/');
    
    // Add the custom path to result.json
    const resultUri = `${basePath}0/custom_output/0/result.json`;
    console.log(`Result JSON URI: ${resultUri}`);
    
    return resultUri;
  } catch (error) {
    console.error(`Error processing S3 URI: ${error}`);
    throw error;
  }
};

/**
 * Fetches the result.json content from S3
 * @param {string} s3Uri - S3 URI pointing to the result.json file
 * @returns {Promise<Object>} Parsed JSON content from the result file
 */
// const fetchResultFromS3 = async (s3Uri) => {
//   try {
//     // Parse the S3 URI to extract bucket and key
//     // Format is s3://bucket-name/path/to/file
//     const url = new URL(s3Uri.replace('s3://', 'https://'));
//     const bucket = url.hostname;
//     const key = url.pathname.substring(1); // Remove leading slash
    
//     console.log(`Fetching result from S3 - Bucket: "${bucket}", Key: "${key}"`);
    
//     // Create S3 client (configure region as needed)
//     const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    
//     const command = new GetObjectCommand({
//       Bucket: bucket,
//       Key: key
//     });
    
//     const response = await s3Client.send(command);
    
//     // Convert stream to string
//     const bodyContents = await streamToString(response.Body);
    
//     // Parse JSON
//     const result = JSON.parse(bodyContents)
//     return result.inference_result;
//   } catch (error) {
//     console.error(`Error fetching from S3: ${error}`);
//     throw error;
//   }
// };

const fetchResultFromS3 = async (s3Uri) => {
  try {
    // Parse the S3 URI to extract bucket and key
    const url = new URL(s3Uri.replace('s3://', 'https://'));
    const bucket = url.hostname;
    const key = url.pathname.substring(1); // Remove leading slash
    
    console.log(`Fetching result from S3 - Bucket: "${bucket}", Key: "${key}"`);
    
  
    // This is the most reliable approach if Bedrock works but S3 doesn't
    const bedrock = createBedrockClient(); // Use your existing Bedrock client creation function
    const credentials = bedrock.config.credentials;
    
    // Create S3 client with the same credentials as Bedrock
    const s3Client = new S3Client({ 
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: credentials
    });
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    // Convert stream to string
    const bodyContents = await streamToString(response.Body);
    
    // Parse JSON
    const result = JSON.parse(bodyContents);
    console.log(result.inference_result)
    return result.inference_result;
  } catch (error) {
    console.error(`Error fetching from S3: ${error}`);
    throw error;
  }
};


/**
 * Helper function to convert stream to string
 * @param {ReadableStream} stream - Stream to convert
 * @returns {Promise<string>} String content
 */
const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
};

module.exports = { analyzeFile };