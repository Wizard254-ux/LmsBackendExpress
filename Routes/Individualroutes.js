const express = require("express");
const router = express.Router();
const studentController = require('../Controllers/Student');
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
const { verifyAdmin } = require('../Middleware/VerifyAdmin');
// router.use('/',verifyAdmin,)

// Department Routes
router.post("/departments", verifyAdmin,createDepartment);
router.get("/departments", verifyAdmin,getAllDepartments);
router.get("/departments/:id",verifyAdmin,getDepartmentById);
router.put("/departments/:id", verifyAdmin,updateDepartment);
router.delete("/departments/:id", verifyAdmin,deleteDepartment);

// Course Routes
router.post("/courses",verifyAdmin, createCourse);
router.get("/courses",verifyAdmin, getAllCourses);
router.get("/courses/:id",verifyAdmin, getCourseById);
router.put("/courses/:id", verifyAdmin,updateCourse);
router.delete("/courses/:id",verifyAdmin, deleteCourse);

// Unit Routes
router.post("/units", verifyAdmin,createUnit);
router.get("/units", verifyAdmin,getAllUnits);
router.get("/units/:id", verifyAdmin,getUnitById);
router.put("/units/:id", verifyAdmin,updateUnit);
router.delete("/units/:id", verifyAdmin,deleteUnit);

// Lecturer Routes
router.post("/lecturers",verifyAdmin, createLecturer);
router.get("/lecturers", verifyAdmin,getAllLecturers);
router.get("/lecturers/:id",verifyAdmin, getLecturerById);
router.put("/lecturers",verifyAdmin, updateLecturer);
router.delete("/lecturers/:id",verifyAdmin, deleteLecturer);


router.post('/students', verifyAdmin,studentController.createStudent);
router.get('/students',verifyAdmin, studentController.getAllStudents);
router.get('/students/:id', verifyAdmin,studentController.getStudentById);
router.put('/students/:id',verifyAdmin, studentController.updateStudent);
router.delete('/students/:id',verifyAdmin, studentController.deleteStudent);
router.get('/students/course/:courseCode',verifyAdmin, studentController.getStudentsByCourse);
router.get('/students/status/:isActive', verifyAdmin,studentController.getStudentsByStatus);

module.exports = router;