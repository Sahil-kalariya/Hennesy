const express = require('express')
const { analyzeFile } = require('../controllers/bedrockController')
const {upload} = require("../controllers/fileHandler")
const {storeFile} = require('../middleware/storeFile')
const router = express.Router()

router.post('/', upload.single('file'), storeFile, analyzeFile);


module.exports = router
