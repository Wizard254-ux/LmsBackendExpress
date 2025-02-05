const express = require("express");
const router = express.Router();
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../Controllers/Department");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require("../Controllers/Course");

const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require("../Controllers/Unit");

const {
  createLecturer,
  getAllLecturers,
  getLecturerById,
  updateLecturer,
  deleteLecturer,
} = require("../Controllers/Lecturer");

// Department Routes
router.post("/departments", createDepartment);
router.get("/departments", getAllDepartments);
router.get("/departments/:id", getDepartmentById);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// Course Routes
router.post("/courses", createCourse);
router.get("/courses", getAllCourses);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Unit Routes
router.post("/units", createUnit);
router.get("/units", getAllUnits);
router.get("/units/:id", getUnitById);
router.put("/units/:id", updateUnit);
router.delete("/units/:id", deleteUnit);

// Lecturer Routes
router.post("/lecturers", createLecturer);
router.get("/lecturers", getAllLecturers);
router.get("/lecturers/:id", getLecturerById);
router.put("/lecturers", updateLecturer);
router.delete("/lecturers/:id", deleteLecturer);

module.exports = router;