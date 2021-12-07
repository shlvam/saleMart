const path = require('path');

const express = require('express');

const is_auth= require('../middleware/is_auth');
const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', is_auth, shopController.getCart); 

router.post('/cart', is_auth, shopController.postCart);

router.get('/checkout', is_auth, shopController.getCheckout);

router.get('/checkout/success', is_auth, shopController.getCheckoutSuccess);

router.get('/checkout/cancel', is_auth, shopController.getCheckout);

router.post('/cart-delete-item', is_auth, shopController.postCartDeleteProduct);

router.get('/orders', is_auth, shopController.getOrders);

router.get('/orders/:orderId', is_auth , shopController.getInvoice);

module.exports = router;
