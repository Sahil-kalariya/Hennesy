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
