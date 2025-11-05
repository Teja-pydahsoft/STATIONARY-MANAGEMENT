const express = require('express');
const router = express.Router();
const {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} = require('../controllers/vendorController');

router.route('/').post(createVendor).get(getVendors);
router.route('/:id').get(getVendorById).put(updateVendor).delete(deleteVendor);

module.exports = router;

