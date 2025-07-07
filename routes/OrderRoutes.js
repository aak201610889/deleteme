const express = require('express');
const OrderController = require('../controllers/OrderController');
const { verifyToken, } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/',verifyToken(), OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);
router.get('/',verifyToken("***"), OrderController.getAllOrders);
// router.put('/:id', OrderController.updateOrder);
router.delete('/:id',verifyToken("***"), OrderController.deleteOrder);
router.delete('/customer/:customerId',verifyToken("***"), OrderController.deleteOrderByCustomerId);
router.get('/customer/:customerId',verifyToken("***"), OrderController.getOrderByCustomerId);
router.get("/top-products/ffff",verifyToken(), OrderController.getTopProducts);
router.get("/api/statistics",verifyToken("***"), OrderController.getStatistics );
router.delete("/api/deleteAllOrderUser/:customerId",verifyToken("***"), OrderController.deleteAllOrderUser );

router.get("/print/:orderId/:printerType/:printerInterface/:tax",verifyToken("***"), OrderController.printing);
module.exports = router;
