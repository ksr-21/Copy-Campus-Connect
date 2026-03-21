const express = require('express');
const router = express.Router();
const {
  getColleges,
  createCollege,
  updateCollege,
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getColleges).post(protect, authorize('Super Admin'), createCollege);
router.route('/:id').put(protect, authorize('Super Admin', 'Director'), updateCollege);

module.exports = router;
