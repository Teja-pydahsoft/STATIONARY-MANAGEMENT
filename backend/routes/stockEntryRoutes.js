const express = require('express');
const router = express.Router();
const {
  createStockEntry,
  getStockEntries,
  getStockEntryById,
  updateStockEntry,
  deleteStockEntry,
} = require('../controllers/stockEntryController');

router.route('/').post(createStockEntry).get(getStockEntries);
router.route('/:id').get(getStockEntryById).put(updateStockEntry).delete(deleteStockEntry);

module.exports = router;

