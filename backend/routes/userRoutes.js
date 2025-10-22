const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  registerUser,
  getAllUsers,
  getUsersByCourse,
  updateUser,
  deleteUser,
  importUsers,
} = require('../controllers/userController');

// Configure multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/users/register -> Register a new student
router.post('/users/register', registerUser);

// GET /api/users -> Get all students from all courses
router.get('/users', getAllUsers);

// GET /api/users/:course -> Get students from a specific course
router.get('/users/:course', getUsersByCourse);

// PUT /api/users/:course/:id -> Update a student's items/paid status
router.put('/users/:course/:id', updateUser);

// DELETE /api/users/:course/:id -> Delete a student
router.delete('/users/:course/:id', deleteUser);

// POST /api/users/import/:course -> Import students from Excel/CSV file
router.post('/users/import/:course', upload.single('file'), importUsers);

module.exports = router;
