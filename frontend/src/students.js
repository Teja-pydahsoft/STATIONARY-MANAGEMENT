const express = require('express');
const router = express.Router();
const Student = require('../models/student');

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new student
router.post('/', async (req, res) => {
  const student = new Student({
    name: req.body.name,
    class: req.body.class,
    section: req.body.section,
    rollNumber: req.body.rollNumber,
    items: req.body.items
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT to update a student's items
router.put('/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { items: req.body.items, paid: req.body.paid },
            { new: true }
        );
        res.json(updatedStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;