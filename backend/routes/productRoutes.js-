const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
} = require('../controllers/productController');

// @route   GET /api/products
// @route   POST /api/products
router.route('/').get(getProducts).post(createProduct);

// @route   GET /api/products/:id
router.route('/:id').get(getProductById);

module.exports = router;