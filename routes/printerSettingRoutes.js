// routes/printerSettingRoutes.js
const express = require('express');
const { getPrinterSetting, savePrinterSetting } = require('../controllers/printerSettingController');
const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

// Route to get the current printer setting
router.get('/',verifyToken("***"), getPrinterSetting);

// Route to add or update the printer setting
router.post('/',verifyToken("***"), savePrinterSetting);

module.exports = router;
