const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  joinCourseRequest,
  handleCourseRequest,
  addStudentsToCourse,
  removeStudentFromCourse,
  addCourseResource,
  takeAttendance,
  sendCourseMessage,
  updateCoursePersonalNote,
  saveCourseFeedback
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('Teacher', 'HOD/Dean', 'Director'), createCourse);

router.route('/:id')
  .put(protect, authorize('Teacher', 'HOD/Dean', 'Director'), updateCourse)
  .delete(protect, authorize('Teacher', 'HOD/Dean', 'Director'), deleteCourse);

router.post('/:id/join', protect, joinCourseRequest);

router.post('/:id/request/:studentId', protect, authorize('Teacher', 'HOD/Dean', 'Director'), handleCourseRequest);
router.post('/:id/students', protect, authorize('Teacher', 'HOD/Dean', 'Director'), addStudentsToCourse);
router.delete('/:id/students/:studentId', protect, authorize('Teacher', 'HOD/Dean', 'Director'), removeStudentFromCourse);
router.post('/:id/resources', protect, authorize('Teacher', 'HOD/Dean', 'Director'), addCourseResource);
router.post('/:id/attendance', protect, authorize('Teacher', 'HOD/Dean', 'Director'), takeAttendance);
router.post('/:id/messages', protect, sendCourseMessage);
router.put('/:id/personal-note', protect, updateCoursePersonalNote);
router.post('/:id/feedback', protect, saveCourseFeedback);

module.exports = router;
