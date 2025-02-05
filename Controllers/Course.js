const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt=require('bcryptjs')

const Course = require("../Models/Courses");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { name, code, departmentId } = req.body;
    const course = new Course({ name, code });
    await course.save();

    // Add the course to the department
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    department.courses.push(course._id);
    await department.save();

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("units");
    res.status(200).json(courses);
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

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

