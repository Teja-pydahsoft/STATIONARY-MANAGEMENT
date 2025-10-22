const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUsers,
} = require('./userController');

// Route for registering a new user and getting all users
// POST /api/students -> Register a new user
// GET  /api/students -> Fetch all users for the dashboard
router.route('/students').post(registerUser).get(getUsers);

module.exports = router;