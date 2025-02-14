const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt=require('bcryptjs')

const Unit = require("../Models/Units");
const Course = require("../Models/Courses");

// Create a new unit
exports.createUnit = async (req, res) => {
  try {
    const { name, code, description, courseId } = req.body;
    
    // Add the unit to the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const unit = new Unit({ name, code, description });
    await unit.save();
    
    course.units.push(unit._id);
    await course.save();

    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all units
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find();

    // For each unit, find the course that references it
    const unitsWithCourse = await Promise.all(
      units.map(async (unit) => {
        // Find the course that includes this unit's _id in its 'units' array
        const course = await Course.findOne({ units: unit._id }).select("name code"); // Only include 'name' and 'code'
        return {
          ...unit.toObject(), // Convert Mongoose document to a plain JavaScript object
          course, // Add the course details
        };
      })
    );

    res.status(200).json(unitsWithCourse);
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message });
  }
};

// Get a single unit by ID
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.status(200).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a unit
exports.updateUnit = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true }
    );
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.status(200).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a unit
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.status(200).json({ message: "Unit deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

