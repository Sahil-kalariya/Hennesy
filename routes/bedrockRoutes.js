const express = require('express')
const { analyzeFile } = require('../controllers/bedrockController')
const upload = require('../middleware/uploadfile')
const {filehandler} = require('../middleware/filehandler')
const router = express.Router()

router.post("/",upload.single("file"),filehandler,analyzeFile)
module.exports = router