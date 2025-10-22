const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Register a new user/student
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, course, year } = req.body;

  // Check if a user with the same email or studentId already exists
  const userExists = await User.findOne({ $or: [{ email }, { studentId }] });

  if (userExists) {
    res.status(400);
    let message = 'User already exists.';
    if (userExists.email === email) {
      message = 'User with this email already exists.';
    } else if (userExists.studentId === studentId) {
      message = 'User with this student ID already exists.';
    }
    throw new Error(message);
  }

  const user = await User.create({
      name,
      email,
      password,
      studentId,
      course,
      year,
    });

  if (user) {
    // Respond with the created user's data (password is not sent due to 'select: false' in model)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      course: user.course,
      year: user.year,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Get all users/students
 * @route   GET /api/users
 * @access  Private/Admin (Should be protected in a real app)
 */
const getUsers = asyncHandler(async (req, res) => {
  // Populate orders for each user, and then populate the books within each order
  const users = await User.find({}).populate({
    path: 'orders',
    populate: {
      path: 'books.book',
      model: 'Product',
    },
  });
  res.status(200).json(users);
});

module.exports = { registerUser, getUsers };