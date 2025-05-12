const express = require('express');
const { analyzeFile } = require('../controllers/bedrockController');
const upload = require('../middleware/uploadfile');
const { filehandler } = require('../middleware/filehandler');
const router = express.Router();
const { dataValidator } = require('../controllers/dataValidator');

router.post("/:id", upload.single("file"), filehandler, analyzeFile, dataValidator);

module.exports = router;