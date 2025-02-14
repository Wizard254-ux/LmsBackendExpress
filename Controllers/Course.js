const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt=require('bcryptjs')

const Course = require("../Models/Courses");
const Department = require("../Models/Departments");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { name, code, departmentId } = req.body;
    
    // Add the course to the department
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    const course = new Course({ name, code });
    await course.save();

    department.courses.push(course._id);
    await department.save();

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all courses
// Course Controller
exports.getAllCourses = async (req, res) => {
  try {
    // First get all courses
    const courses = await Course.find().populate("units");
    
    // Then get all departments and their courses
    const departments = await Department.find().populate('courses');
    
    // For each course, find its department
    const coursesWithDept = courses.map(course => {
      const department = departments.find(dept => 
        dept.courses.some(deptCourse => 
          deptCourse._id.toString() === course._id.toString()
        )
      );
      
      return {
        ...course.toObject(),
        departmentId: department?._id,
        departmentName: department?.name
      };
    });

    res.status(200).json(coursesWithDept);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    // First find the course
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find and update the department that contains this course
    await Department.updateMany(
      { courses: course._id },
      { $pull: { courses: course._id } }
    );

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get a single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("units");
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { name, code } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

