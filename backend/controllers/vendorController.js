const { Vendor } = require('../models/vendorModel');

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * @desc    Create a new vendor
 * @route   POST /api/vendors
 * @access  Public
 */
const createVendor = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
      paymentTerms,
      remarks,
      bankDetails = {},
      accountHolderName,
      bankName,
      branchName,
      accountNumber,
      ifscCode,
      upiId,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    // Check if vendor with same name already exists
    const existingVendor = await Vendor.findOne({ name: name.trim() });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor with this name already exists' });
    }

    const vendor = new Vendor({
      name: name.trim(),
      contactPerson: trimString(contactPerson),
      email: trimString(email).toLowerCase(),
      phone: trimString(phone),
      address: trimString(address),
      gstNumber: trimString(gstNumber),
      paymentTerms: trimString(paymentTerms),
      remarks: trimString(remarks),
      isActive: true,
      bankDetails: {
        accountHolderName: trimString(accountHolderName ?? bankDetails.accountHolderName),
        bankName: trimString(bankName ?? bankDetails.bankName),
        branchName: trimString(branchName ?? bankDetails.branchName),
        accountNumber: trimString(accountNumber ?? bankDetails.accountNumber),
        ifscCode: trimString(ifscCode ?? bankDetails.ifscCode).toUpperCase(),
        upiId: trimString(upiId ?? bankDetails.upiId),
      },
    });

    const createdVendor = await vendor.save();
    res.status(201).json(createdVendor);
  } catch (error) {
    console.error('Error in createVendor:', error);
    res.status(400).json({ message: 'Error creating vendor', error: error.message });
  }
};

/**
 * @desc    Get all vendors
 * @route   GET /api/vendors
 * @access  Public
 */
const getVendors = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const vendors = await Vendor.find(filter).sort({ name: 1 });
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error in getVendors:', error);
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
};

/**
 * @desc    Get a single vendor by ID
 * @route   GET /api/vendors/:id
 * @access  Public
 */
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (vendor) {
      res.status(200).json(vendor);
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error('Error in getVendorById:', error);
    res.status(500).json({ message: 'Error fetching vendor', error: error.message });
  }
};

/**
 * @desc    Update a vendor
 * @route   PUT /api/vendors/:id
 * @access  Public
 */
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
      paymentTerms,
      remarks,
      isActive,
      bankDetails = {},
      accountHolderName,
      bankName,
      branchName,
      accountNumber,
      ifscCode,
      upiId,
    } = req.body;

    // If name is being changed, check if new name already exists
    if (name && name.trim() !== vendor.name) {
      const existingVendor = await Vendor.findOne({ name: name.trim() });
      if (existingVendor) {
        return res.status(400).json({ message: 'Vendor with this name already exists' });
      }
      vendor.name = name.trim();
    }

    if (contactPerson !== undefined) vendor.contactPerson = trimString(contactPerson);
    if (email !== undefined) vendor.email = trimString(email).toLowerCase();
    if (phone !== undefined) vendor.phone = trimString(phone);
    if (address !== undefined) vendor.address = trimString(address);
    if (gstNumber !== undefined) vendor.gstNumber = trimString(gstNumber);
    if (paymentTerms !== undefined) vendor.paymentTerms = trimString(paymentTerms);
    if (remarks !== undefined) vendor.remarks = trimString(remarks);
    if (isActive !== undefined) vendor.isActive = isActive;

    const updatedBankDetails = {
      accountHolderName: trimString(accountHolderName ?? bankDetails.accountHolderName ?? vendor.bankDetails?.accountHolderName),
      bankName: trimString(bankName ?? bankDetails.bankName ?? vendor.bankDetails?.bankName),
      branchName: trimString(branchName ?? bankDetails.branchName ?? vendor.bankDetails?.branchName),
      accountNumber: trimString(accountNumber ?? bankDetails.accountNumber ?? vendor.bankDetails?.accountNumber),
      ifscCode: trimString(ifscCode ?? bankDetails.ifscCode ?? vendor.bankDetails?.ifscCode).toUpperCase(),
      upiId: trimString(upiId ?? bankDetails.upiId ?? vendor.bankDetails?.upiId),
    };

    vendor.bankDetails = updatedBankDetails;

    const updated = await vendor.save();
    res.json(updated);
  } catch (error) {
    console.error('Error in updateVendor:', error);
    res.status(400).json({ message: 'Error updating vendor', error: error.message });
  }
};

/**
 * @desc    Delete a vendor
 * @route   DELETE /api/vendors/:id
 * @access  Public
 */
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ message: 'Vendor removed' });
  } catch (error) {
    console.error('Error in deleteVendor:', error);
    res.status(500).json({ message: 'Error deleting vendor', error: error.message });
  }
};

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};

