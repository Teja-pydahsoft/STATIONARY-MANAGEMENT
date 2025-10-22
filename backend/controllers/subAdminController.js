const asyncHandler = require('express-async-handler');
const { SubAdmin } = require('../models/subAdminModel');

// GET /api/subadmins
const listSubAdmins = asyncHandler(async (req, res) => {
  const subadmins = await SubAdmin.find({}).select('-password');
  res.json(subadmins);
});

// POST /api/subadmins
const createSubAdmin = asyncHandler(async (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password) {
    res.status(400);
    throw new Error('Name and password are required');
  }
  const exists = await SubAdmin.findOne({ name });
  if (exists) {
    res.status(400);
    throw new Error('Sub-admin with this name already exists');
  }
  const created = await SubAdmin.create({ name, password, role });
  res.status(201).json({ _id: created._id, name: created.name, role: created.role });
});

// PUT /api/subadmins/:id
const updateSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, password, role } = req.body;
  const sub = await SubAdmin.findById(id).select('+password');
  if (!sub) {
    res.status(404);
    throw new Error('Sub-admin not found');
  }
  if (name) sub.name = name;
  if (role) sub.role = role;
  if (password) sub.password = password; // will be hashed by pre-save
  const saved = await sub.save();
  res.json({ _id: saved._id, name: saved.name, role: saved.role });
});

// DELETE /api/subadmins/:id
const deleteSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sub = await SubAdmin.findById(id);
  if (!sub) {
    res.status(404);
    throw new Error('Sub-admin not found');
  }
  await SubAdmin.findByIdAndDelete(id);
  res.json({ message: 'Deleted' });
});

// POST /api/subadmins/login
const loginSubAdmin = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const sub = await SubAdmin.findOne({ name }).select('+password');
  if (!sub) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const ok = await sub.comparePassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  res.json({ _id: sub._id, name: sub.name, role: sub.role });
});

module.exports = {
  listSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  loginSubAdmin,
};


