const express = require('express');
const router = express.Router();
const { getAcademicConfig, upsertAcademicConfig, listCourses, createCourse, deleteCourse } = require('../controllers/academicConfigController');

router.get('/config/academic', getAcademicConfig);
router.put('/config/academic', upsertAcademicConfig);

// Courses specific CRUD
router.get('/academic-config/courses', listCourses);
router.post('/academic-config/courses', createCourse);
router.delete('/academic-config/courses/:id', deleteCourse);

module.exports = router;


