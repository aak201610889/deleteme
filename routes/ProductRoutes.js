const express = require('express');
const ProductController = require('../controllers/ProductController');
const upload = require("../middlewares/upload");
const { verifyToken, } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/',verifyToken("***"),  upload.single("Image"), ProductController.createProduct);
router.get('/:id',verifyToken(), ProductController.getProductById);
router.get('/', ProductController.getAllProducts);

router.get('/withoutfilter/allProducts', ProductController.getAllProductsWithoutFilter);
router.delete('/:id',verifyToken("***"), ProductController.deleteProduct);
router.put('/:id',verifyToken("***"), ProductController.updateProduct);
module.exports = router;