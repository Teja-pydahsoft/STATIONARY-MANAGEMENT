const { StockEntry } = require('../models/stockEntryModel');
const { Product } = require('../models/productModel');
const { Vendor } = require('../models/vendorModel');

/**
 * @desc    Create a new stock entry and update product stock
 * @route   POST /api/stock-entries
 * @access  Public
 */
const createStockEntry = async (req, res) => {
  try {
    const { product, vendor, quantity, invoiceNumber, invoiceDate, purchasePrice, remarks, createdBy } = req.body;

    // Validate required fields
    if (!product || !vendor || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product, vendor, and quantity (>=1) are required' });
    }

    // Verify product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify vendor exists
    const vendorDoc = await Vendor.findById(vendor);
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate total cost
    const totalCost = (purchasePrice || 0) * quantity;

    const stockEntry = new StockEntry({
      product,
      vendor,
      quantity,
      invoiceNumber: invoiceNumber?.trim() || '',
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      purchasePrice: purchasePrice || 0,
      totalCost,
      remarks: remarks?.trim() || '',
      createdBy: createdBy?.trim() || 'System',
    });

    const createdStockEntry = await stockEntry.save();

    // Update product stock
    productDoc.stock = (productDoc.stock || 0) + quantity;
    await productDoc.save();

    // Populate the created stock entry for response
    await createdStockEntry.populate('product', 'name price');
    await createdStockEntry.populate('vendor', 'name');

    res.status(201).json(createdStockEntry);
  } catch (error) {
    console.error('Error in createStockEntry:', error);
    res.status(400).json({ message: 'Error creating stock entry', error: error.message });
  }
};

/**
 * @desc    Get all stock entries
 * @route   GET /api/stock-entries
 * @access  Public
 */
const getStockEntries = async (req, res) => {
  try {
    const { product, vendor, startDate, endDate } = req.query;
    const filter = {};

    if (product) filter.product = product;
    if (vendor) filter.vendor = vendor;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const stockEntries = await StockEntry.find(filter)
      .populate('product', 'name price')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(stockEntries);
  } catch (error) {
    console.error('Error in getStockEntries:', error);
    res.status(500).json({ message: 'Error fetching stock entries', error: error.message });
  }
};

/**
 * @desc    Get a single stock entry by ID
 * @route   GET /api/stock-entries/:id
 * @access  Public
 */
const getStockEntryById = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id)
      .populate('product', 'name price stock')
      .populate('vendor', 'name contactPerson email phone');

    if (stockEntry) {
      res.status(200).json(stockEntry);
    } else {
      res.status(404).json({ message: 'Stock entry not found' });
    }
  } catch (error) {
    console.error('Error in getStockEntryById:', error);
    res.status(500).json({ message: 'Error fetching stock entry', error: error.message });
  }
};

/**
 * @desc    Update a stock entry
 * @route   PUT /api/stock-entries/:id
 * @access  Public
 */
const updateStockEntry = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    const { quantity, invoiceNumber, invoiceDate, purchasePrice, remarks } = req.body;
    const oldQuantity = stockEntry.quantity;
    const oldProductId = stockEntry.product.toString();

    // If quantity is being changed, update product stock accordingly
    if (quantity !== undefined && quantity !== oldQuantity) {
      const product = await Product.findById(stockEntry.product);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const quantityDiff = quantity - oldQuantity;
      
      // Update product stock
      product.stock = (product.stock || 0) + quantityDiff;
      if (product.stock < 0) {
        return res.status(400).json({ message: 'Cannot reduce stock below 0' });
      }
      await product.save();
    }

    // Update stock entry fields
    if (quantity !== undefined) {
      stockEntry.quantity = quantity;
      // Recalculate total cost
      stockEntry.totalCost = (stockEntry.purchasePrice || 0) * quantity;
    }
    if (invoiceNumber !== undefined) stockEntry.invoiceNumber = invoiceNumber?.trim() || '';
    if (invoiceDate !== undefined) stockEntry.invoiceDate = new Date(invoiceDate);
    if (purchasePrice !== undefined) {
      stockEntry.purchasePrice = purchasePrice;
      // Recalculate total cost
      stockEntry.totalCost = purchasePrice * (stockEntry.quantity || 0);
    }
    if (remarks !== undefined) stockEntry.remarks = remarks?.trim() || '';

    const updated = await stockEntry.save();
    await updated.populate('product', 'name price');
    await updated.populate('vendor', 'name');

    res.json(updated);
  } catch (error) {
    console.error('Error in updateStockEntry:', error);
    res.status(400).json({ message: 'Error updating stock entry', error: error.message });
  }
};

/**
 * @desc    Delete a stock entry and restore product stock
 * @route   DELETE /api/stock-entries/:id
 * @access  Public
 */
const deleteStockEntry = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    // Restore product stock
    const product = await Product.findById(stockEntry.product);
    if (product) {
      product.stock = Math.max(0, (product.stock || 0) - stockEntry.quantity);
      await product.save();
    }

    await StockEntry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Stock entry removed' });
  } catch (error) {
    console.error('Error in deleteStockEntry:', error);
    res.status(500).json({ message: 'Error deleting stock entry', error: error.message });
  }
};

module.exports = {
  createStockEntry,
  getStockEntries,
  getStockEntryById,
  updateStockEntry,
  deleteStockEntry,
};

