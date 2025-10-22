const express = require('express');
const router = express.Router();
const {
  listSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  loginSubAdmin,
} = require('../controllers/subAdminController');

router.get('/subadmins', listSubAdmins);
router.post('/subadmins', createSubAdmin);
router.put('/subadmins/:id', updateSubAdmin);
router.delete('/subadmins/:id', deleteSubAdmin);
router.post('/subadmins/login', loginSubAdmin);

module.exports = router;


