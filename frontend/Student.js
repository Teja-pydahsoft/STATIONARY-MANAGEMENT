const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  paid: { type: Boolean, default: false },
  items: {
    type: Map,
    of: Boolean,
  },
});

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;