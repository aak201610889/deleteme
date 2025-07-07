// routes/categoryRoutes.js
const express = require('express');
const categoryController = require('../controllers/CategoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require("../middlewares/upload");
const router = express.Router();

router.get('/',verifyToken(), categoryController.getCategories);
router.post('/',verifyToken("***"),  upload.single("image"), categoryController.createCategory);
router.delete('/:id',verifyToken("***"), categoryController.deleteCategory);

module.exports = router;
