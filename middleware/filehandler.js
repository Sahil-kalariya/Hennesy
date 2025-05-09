const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config(); // 


exports.filehandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create S3 instance with credentials from .env file
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    const fileContent = fs.readFileSync(req.file.path);
    
    console.log(process.env.AWS_S3_BUCKET_NAME);
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `uploads/${req.file.filename}`,
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    const s3Data = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // Cleanup temp file
    const formattedS3Url = `s3://${process.env.AWS_S3_BUCKET_NAME}/uploads/${req.file.filename}`;

    console.log(s3Data.Location)
    req.S3url = formattedS3Url;
    next();
  } catch (error) {
    console.error('Error in filehandler:', error);
    if (req.file?.path) fs.unlinkSync(req.file.path); // Cleanup if needed
    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
};