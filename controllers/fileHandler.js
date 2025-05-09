const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.memoryStorage(); // Store file in memory for S3 upload

// Configure file filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  // Add your file type validation here
  // For example, to allow only images and PDFs:
  const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, jpeg, png and pdf are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = {upload}