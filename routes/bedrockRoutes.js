const express = require('express')
const { analyzeFile } = require('../controllers/bedrockController')
const router = express.Router()

router.get("/" , analyzeFile)

module.exports = router