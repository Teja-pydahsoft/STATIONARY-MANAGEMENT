const express = require('express');
const { getSqlStudents, syncSqlStudents } = require('../controllers/sqlStudentController');

const router = express.Router();

router.get('/students', getSqlStudents);
router.post('/students/sync', syncSqlStudents);

module.exports = router;


