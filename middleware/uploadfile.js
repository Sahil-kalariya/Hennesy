const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'temp-uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanFilename = file.originalname.replace(/[^\w.-]/g, '-');
    console.log(cleanFilename)
    cb(null, Date.now() + '-' + cleanFilename);
  }
});

// Set up multer middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Optional: You can restrict file types here
    cb(null, true);
  }
});

module.exports = upload;
