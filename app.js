const { server, app, express } = require("./server");
const path = require("path");
const cookieParser=require('cookie-parser')
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt=require('bcryptjs')
app.use(express.json());
app.use(cookieParser());
require("dotenv").config();
app.use(cors({ origin: ["http://localhost:5173","https://learnig-management-sytem.vercel.app"] ,credentials:true}));
const PORT = process.env.PORT || 3000;

// const Department = require("./Models/Departments");
// const Course = require("./Models/Courses");
// const Unit = require("./Models/Units");
// const Lecturer = require("./Models/Lecturers");
// const Student = require("./Models/StudentProfile");
// const AdminAccount=require('./Models/Admin')

const routes1 = require("./Routes/Individualroutes");
const userAuthenticate=require('./Routes/Auth')

app.use("/api", routes1);
app.use('/api/auth',userAuthenticate)
app.use('/api/Lec',userAuthenticate)
app.use('/api/Lec',userAuthenticate)
app.use('/api/student',userAuthenticate)
app.use('/api/file',userAuthenticate)
app.use('/api/user',userAuthenticate)
app.use('/api/admin',userAuthenticate)





server.listen(PORT, () => {
  console.log("Server running on port 5000");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");

  // const salt = await bcrypt.genSalt(10);
  //       const hashedPassword = await bcrypt.hash("omuya001", salt);

  //       // Create new lecturer account
  //       const newLecAccount = new AdminAccount({
  //           username: "Omuya001",
  //           password: hashedPassword,
  //           email:"Omuya254@gmail.com"
  //       });

  //       // Save the account
  //       await newLecAccount.save();

  // try {
  //     // Check if students already exist to prevent duplicates
  //     const existingStudents = await Student.find();
  //     if (existingStudents.length > 0) {
  //         console.log("Students already exist in the database.");
  //         return;
  //     }

  //     // Student data to insert
  //     const students = [
  //         { studentNumber: "STU001", courseCode: "CS101", isActive: true },
  //         { studentNumber: "STU002", courseCode: "SE102", isActive: true },
  //         { studentNumber: "STU003", courseCode: "IT103", isActive: true }
  //     ];

  //     // Insert into the database
  //     await Student.insertMany(students);
  //     console.log("Students added successfully!");
  // } catch (error) {
  //     console.error("Error seeding students:", error);
  // }



    // // Clear existing data (optional, to avoid duplicates)
    // await Unit.deleteMany({});
    // await Course.deleteMany({});
    // await Department.deleteMany({});

    // // Create Units
    // const units = await Unit.insertMany([
    //   { name: "Mathematics 101", code: "MATH101" },
    //   { name: "Physics 101", code: "PHYS101" },
    //   { name: "Computer Science Basics", code: "CSB100" },
    //   { name: "Data Structures", code: "DS102" },
    //   { name: "Operating Systems", code: "OS201" },
    //   { name: "Web Development", code: "WD301" },
    //   { name: "Artificial Intelligence", code: "AI401" },
    // ]);

    // // Create Courses
    // const courses = await Course.insertMany([
    //   {
    //     name: "Computer Science",
    //     code: "CS101",
    //     units: [units[0]._id, units[1]._id, units[2]._id],
    //   },
    //   {
    //     name: "Software Engineering",
    //     code: "SE102",
    //     units: [units[2]._id, units[3]._id, units[4]._id],
    //   },
    //   {
    //     name: "Information Technology",
    //     code: "IT103",
    //     units: [units[4]._id, units[5]._id, units[6]._id],
    //   },
    // ]);

    // // Create Departments
    // await Department.insertMany([
    //   { name: "Engineering", courses: [courses[0]._id, courses[1]._id],shortName:"Eng" },
    //   { name: "Computer Science", courses: [courses[1]._id, courses[2]._id],shortName:"CS" },
    //   { name: "Information Systems", courses: [courses[2]._id],shortName:"IS" },
    // ]);

    
    // const engineeringDepartment = await Department.findOne({ name: "Engineering" });
    // const csDepartment = await Department.findOne({ name: "Computer Science" });
    
    // if (!engineeringDepartment || !csDepartment) {
        //   console.error("Departments not found! Ensure departments exist before adding lecturers.");
    //   return;
    // }

    // // Add Lecturers
    // await Lecturer.insertMany([
    //   { staffNumber: "ENG123", name: "Dr. John Doe", department: engineeringDepartment._id, units: [units[4]._id, units[5]._id, units[6]._id],isActive:"true" },
    //   { staffNumber: "ENG124", name: "Prof. Jane Smith", department: engineeringDepartment._id,units:[units[2]._id, units[3]._id, units[4]._id],isActive:"true" },
    //   { staffNumber: "CS101", name: "Dr. Alice Brown", department: csDepartment._id,units: [units[0]._id, units[1]._id, units[2]._id],isActive:"true" },
    // ]);
    // console.log("Sample data added successfully!");
  })
  .catch((err) => console.error("MongoDB connection error:", err));
