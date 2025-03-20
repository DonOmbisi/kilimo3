const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/verify');

// create order
router.post('/create', verifyToken, orderController.createOrder);

// confirm delivery
router.post('/confirm', verifyToken, orderController.confirmDelivery);

// get order
router.get('/:id', verifyToken, orderController.getOrder);

// get all orders
router.get('/get/all', verifyToken, orderController.getAllOrders);
module.exports = router;
