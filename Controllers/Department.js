const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt=require('bcryptjs')

const Department = require("../Models/Departments");

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const department = new Department({ name });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate("courses");
    res.status(200).json(departments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      "courses"
    );
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};