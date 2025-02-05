const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt=require('bcryptjs')
const mongoose = require("mongoose");


const Lecturer = require("../Models/Lecturers");
const Unit = require("../Models/Units");
const Department = require("../Models/Departments");

// Create a new lecturer
exports.createLecturer = async (req, res) => {
  try {
    // Destructure and extract data from the request body
    const { staffNumber, name, isActive, department, units,email,phoneNumber } = req.body;

    // Extract the department ID from the department object
    const departmentId = department.id;

    // Check if the department exists
    const departmentExists = await Department.findById(departmentId);
    if (!departmentExists) {
      return res.status(400).json({ error: "Department not found" });
    }

        // Check if a lecturer with the same email or phone number already exists
        const existingLecturer = await Lecturer.findOne({
          $or: [
            { email: email },
            { phoneNumber: phoneNumber }
          ]
        });
    
        if (existingLecturer) {
          // Determine which field caused the conflict
          if (existingLecturer.email === email) {
            return res.status(400).json({ error: "Email already exists" });
          }
          if (existingLecturer.phoneNumber === phoneNumber) {
            return res.status(400).json({ error: "Phone number already exists" });
          }
        }

    // Extract unit IDs from the units array (which contains objects)
    const unitIds = units.map(unit => unit.id);

    // Validate if all unit IDs exist in the database
    const existingUnits = await Unit.find({ _id: { $in: unitIds } });
    if (existingUnits.length !== unitIds.length) {
      return res.status(400).json({ error: "One or more units not found" });
    }

    // Create a new Lecturer instance
    const newLecturer = new Lecturer({
      staffNumber,
      phoneNumber,
      email,
      name,
      isActive,
      department: departmentId, // Store only the department ObjectId
      units: unitIds, // Store only the unit ObjectIds
    });

    // Save the lecturer to the database
    const savedLecturer = await newLecturer.save();
   console.log(savedLecturer)
    // Return the saved lecturer data as a response
    res.status(201).json(savedLecturer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all lecturers
exports.getAllLecturers = async (req, res) => {
    try {
      const lecturers = await Lecturer.find().populate("department").populate("units");
      console.log(lecturers)
      console.log(JSON.stringify(lecturers, null, 2));

      
      res.status(200).json(lecturers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  

// Get a single lecturer by ID
exports.getLecturerById = async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id).populate(
      "department"
    );
    if (!lecturer) {
      return res.status(404).json({ error: "Lecturer not found" });
    }
    res.status(200).json(lecturer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a lecturer


exports.updateLecturer = async (req, res) => {
  const { lecturerId, department, name, isActive, email, phoneNumber } = req.body;
  const addedUnits = req.body.units?.added || [];
  const removedUnits = req.body.units?.removed || [];

  try {
      // Fetch the lecturer
      const lecturer = await Lecturer.findById(lecturerId);
      if (!lecturer) {
          return res.status(404).json({ message: "Lecturer not found" });
      }

      // Check for unique email if provided
      if (email && email !== lecturer.email) {
          const existingEmailLecturer = await Lecturer.findOne({ email });
          if (existingEmailLecturer) {
              return res.status(400).json({ message: "Email is already in use by another lecturer" });
          }
          lecturer.email = email;
      }

      // Check for unique phone number if provided
      if (phoneNumber && phoneNumber !== lecturer.phoneNumber) {
          const existingPhoneLecturer = await Lecturer.findOne({ phoneNumber });
          if (existingPhoneLecturer) {
              return res.status(400).json({ message: "Phone number is already in use by another lecturer" });
          }
          lecturer.phoneNumber = phoneNumber;
      }

      // Update name if provided
      if (name) {
          lecturer.name = name;
      }

      // Update isActive if provided
      if (typeof isActive === 'boolean') {
          lecturer.isActive = isActive;
      }

      if (department) {
          const currentDepartment = lecturer.department;
          if (currentDepartment && currentDepartment.toString() === department.id) {
              return res.status(400).json({ message: "Lecturer is already in this department" });
          }

          // Validate the new department
          const newDepartment = await Department.findById(department.id);
          if (!newDepartment) {
              return res.status(404).json({ message: "Department not found" });
          }

          // Update department
          lecturer.department = department.id;
      }

      // Convert unit IDs to ObjectId
      const addedUnitIds = addedUnits.map(unit => new mongoose.Types.ObjectId(unit.id));
      const removedUnitIds = removedUnits.map(unit => new mongoose.Types.ObjectId(unit.id));

      // Add new units if they are not already assigned
      for (const unitId of addedUnitIds) {
          if (!lecturer.units.some(existingId => existingId.toString() === unitId.toString())) {
              lecturer.units.push(unitId);
          }
      }

      // Remove units
      if (removedUnitIds.length > 0) {
          lecturer.units = lecturer.units.filter(unitId =>
              !removedUnitIds.some(removeId => removeId.toString() === unitId.toString())
          );
      }

      const response = await lecturer.save();
      res.status(200).json({
          message: "Lecturer profile updated successfully",
          data: response
      });
  } catch (error) {
      console.error(error);

      if (error.code === 11000) {
          return res.status(400).json({
              message: "Duplicate key error: Staff number must be unique"
          });
      }

      res.status(500).json({ message: "Internal server error" });
  }
};
exports.deleteLecturer = async (req, res) => {
  try {
    console.log(req.params.id)
    const lecturer = await Lecturer.findByIdAndDelete(req.params.id);
    if (!lecturer) {
      return res.status(404).json({ error: "Lecturer not found" });
    }
    res.status(200).json({ message: "Lecturer deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};