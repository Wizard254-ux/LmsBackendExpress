const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
app.use(express.json())
const bcrypt = require('bcryptjs')

const Student = require("../Models/StudentProfile");
const Course = require("../Models/Courses");

// Create a new student
exports.createStudent = async (req, res) => {
  try {
    const { studentNumber, courseCode, isActive } = req.body;

    // Check if student number already exists
    const existingStudent = await Student.findOne({ studentNumber });
    if (existingStudent) {
      return res.status(400).json({ error: "Student number already exists" });
    }

    // Verify course exists
    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      return res.status(400).json({ error: "Invalid course code" });
    }

    const student = new Student({
      studentNumber,
      courseCode,
      isActive: isActive ?? true
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    // For each student, get the course details
    const studentsWithCourse = await Promise.all(
      students.map(async (student) => {
        const course = await Course.findOne({ code: student.courseCode })
          .select("name code");
        return {
          ...student.toObject(),
          course
        };
      })
    );

    console.log(studentsWithCourse)

    res.status(200).json(studentsWithCourse);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

// Get a single student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const course = await Course.findOne({ code: student.courseCode })
      .select("name code");

    res.status(200).json({
      ...student.toObject(),
      course
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a student
exports.updateStudent = async (req, res) => {
  try {
    const { studentNumber, courseCode, isActive } = req.body;

    // Check if new student number already exists (if it's being changed)
    const existingStudent = await Student.findOne({
      studentNumber,
      _id: { $ne: req.params.id }
    });
    if (existingStudent) {
      return res.status(400).json({ error: "Student number already exists" });
    }

    // Verify course exists if course is being changed
    if (courseCode) {
      const course = await Course.findOne({ code: courseCode });
      if (!course) {
        return res.status(400).json({ error: "Invalid course code" });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { studentNumber, courseCode, isActive },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const course = await Course.findOne({ code: student.courseCode })
      .select("name code");

    res.status(200).json({
      ...student.toObject(),
      course
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get students by course code
exports.getStudentsByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;
    const students = await Student.find({ courseCode })
      .sort({ studentNumber: 1 });

    const course = await Course.findOne({ code: courseCode })
      .select("name code");

    const studentsWithCourse = students.map(student => ({
      ...student.toObject(),
      course
    }));

    res.status(200).json(studentsWithCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get active/inactive students
exports.getStudentsByStatus = async (req, res) => {
  try {
    const isActive = req.params.isActive === 'true';
    const students = await Student.find({ isActive })
      .sort({ studentNumber: 1 });

    const studentsWithCourse = await Promise.all(
      students.map(async (student) => {
        const course = await Course.findOne({ code: student.courseCode })
          .select("name code");
        return {
          ...student.toObject(),
          course
        };
      })
    );

    res.status(200).json(studentsWithCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};