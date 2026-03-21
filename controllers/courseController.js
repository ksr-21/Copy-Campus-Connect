const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const query = collegeId ? { collegeId } : {};
    const courses = await Course.find(query);
    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Faculty
const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({
      ...req.body,
      facultyId: req.user.id,
    });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Faculty
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Faculty
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    await course.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a course request
// @route   POST /api/courses/:id/join
// @access  Private
const joinCourseRequest = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    if (!course.pendingStudents.includes(req.user.id)) {
      course.pendingStudents.push(req.user.id);
      await course.save();
    }
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Handle course request (approve/reject)
// @route   POST /api/courses/:id/request/:studentId
// @access  Private/Faculty
const handleCourseRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    course.pendingStudents = course.pendingStudents.filter(id => id.toString() !== req.params.studentId);
    if (action === 'approve') {
      if (!course.students.includes(req.params.studentId)) {
        course.students.push(req.params.studentId);
      }
    }
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Add students to course
// @route   POST /api/courses/:id/students
// @access  Private/Faculty
const addStudentsToCourse = async (req, res, next) => {
    try {
        const { studentIds } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404);
            throw new Error('Course not found');
        }
        studentIds.forEach(id => {
            if (!course.students.includes(id)) {
                course.students.push(id);
            }
        });
        await course.save();
        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
};

// @desc    Remove student from course
// @route   DELETE /api/courses/:id/students/:studentId
// @access  Private/Faculty
const removeStudentFromCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404);
            throw new Error('Course not found');
        }
        course.students = course.students.filter(id => id.toString() !== req.params.studentId);
        await course.save();
        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
};

// @desc    Add resource to course (note/assignment)
// @route   POST /api/courses/:id/resources
// @access  Private/Faculty
const addCourseResource = async (req, res, next) => {
  try {
    const { type, resource } = req.body; // type: 'note' | 'assignment'
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const newResource = {
        ...resource,
        id: Date.now().toString(),
        [type === 'note' ? 'uploadedAt' : 'postedAt']: Date.now()
    };

    if (type === 'note') {
      course.notes.push(newResource);
    } else {
      course.assignments.push(newResource);
    }

    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Take attendance
// @route   POST /api/courses/:id/attendance
// @access  Private/Faculty
const takeAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    course.attendanceRecords.push({ date, records });
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// @desc    Send course message
// @route   POST /api/courses/:id/messages
// @access  Private
const sendCourseMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    course.messages.push({
      senderId: req.user.id,
      text,
      timestamp: Date.now()
    });
    await course.save();
    res.status(200).json(course.messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Update personal note for course
// @route   PUT /api/courses/:id/personal-note
// @access  Private
const updateCoursePersonalNote = async (req, res, next) => {
    try {
        const { note } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404);
            throw new Error('Course not found');
        }
        if (!course.personalNotes) course.personalNotes = new Map();
        course.personalNotes.set(req.user.id.toString(), note);
        await course.save();
        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
};

// @desc    Save course feedback
// @route   POST /api/courses/:id/feedback
// @access  Private
const saveCourseFeedback = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404);
            throw new Error('Course not found');
        }
        course.feedback.push({
            studentId: req.user.id,
            rating,
            comment,
            timestamp: Date.now()
        });
        await course.save();
        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
