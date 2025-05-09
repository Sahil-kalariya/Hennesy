const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS SDK v3


const storeFile = async (req, res, next) => {
  try {
    const s3Client = new S3Client({
      region: (process.env.AWS_REGION || 'us-east-1').trim(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
        sessionToken: process.env.AWS_SESSION_TOKEN?.trim()
      }
    });
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    console.log(typeof(process.env.AWS_REGION))
    console.log("acce");
    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    
    // Create a unique file name
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Set up the S3 upload parameters
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype, // Adding content type for better handling in S3
    };
    
    // Upload to S3 using AWS SDK v3
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    // Construct the S3 URL
    const fileurl = `s3://${process.env.AWS_S3_BUCKET_NAME}/${fileName}`;
    // const fileUrl = `s3://${fileName}`;
    
    // Add the S3 file URL to the request object so analyzeFile can use it
    req.fileUrl = fileu.
    rl;
    console.log("end")
    // Continue to the next middleware
    next();
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error uploading file to S3',
      error: error.message
    });
  }
};

module.exports = { storeFile };