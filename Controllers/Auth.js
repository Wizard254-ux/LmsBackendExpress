const express=require('express')
const app=express()
require("dotenv").config(); // Load environment variables
const jwt=require('jsonwebtoken')
app.use(express.json())
const mongoose=require('mongoose')
const bcrypt = require('bcryptjs');
const Lecturer = require('../Models/Lecturers');
const LecAccount = require('../Models/LecAccount');
const Course = require('../Models/Courses');
const Assignment = require('../Models/Assignment');
const Student=require('../Models/StudentProfile')
const StudentAccount=require('../Models/StudentAccount')
const AdminAccount=require('../Models/Admin')
const Notes=require('../Models/Notes')
const Units=require('../Models/Units')
const fs=require('fs')
const path=require('path')


exports.createLecturer = async (req, res) => {
    try {
        const { staffNumber, email, password, username } = req.body;

        // Validate input
        if (!staffNumber || !email || !password || !username) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if lecturer exists with given staffNumber or email
        const existingLecturer = await Lecturer.findOne({
            $or: [
                { staffNumber: staffNumber },
                { email: email }
            ]
        }).populate('department');

        if (!existingLecturer) {
            return res.status(404).json({ message: "Lecturer not found in the system" });
        }

        // Check if a lecturer account already exists
        const existingLecAccount = await LecAccount.findOne({
            $or: [
                { username: username },
                { lecturerRef: existingLecturer._id }
            ]
        });

        if (existingLecAccount) {
            return res.status(400).json({ 
                message: "Account already exists",
                ...(existingLecAccount.username === username && { reason: "Username already taken" }),
                ...(existingLecAccount.lecturerRef.includes(existingLecturer._id) && { reason: "Account already created for this lecturer" })
            });
        }


        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new lecturer account
        const newLecAccount = new LecAccount({
            username: username,
            password: hashedPassword,
            lecturerRef: [existingLecturer._id]
        });

        // Save the account
        await newLecAccount.save();

        // Generate access token
        const accessToken = jwt.sign(
            { 
                id: existingLecturer._id, 
                username: newLecAccount.username,
                role: 'lecturer'
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { 
                id: existingLecturer._id, 
                username: newLecAccount.username,
                role: 'lecturer'
            }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
          });
      
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });

        // Respond with success message, lecturer info, and tokens
        res.status(201).json({ 
            message: "Lecturer account created successfully",
            lecturer: {
                lecturerProfileid: existingLecturer._id,
                name: existingLecturer.name,
                email: existingLecturer.email,
                staffNumber: existingLecturer.staffNumber,
                department: existingLecturer.department.name,
                isActive: existingLecturer.isActive,
                username: newLecAccount.username,
                accountId:newLecAccount._id,
                phoneNumber:existingLecturer.phoneNumber,
                role:"lecturer"
            },
           
        });

    } catch (error) {
        console.error('Lecturer account creation error:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};


// Login Controller with Cookie-based Authentication
exports.loginLecturer = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find the lecturer account
      const lecAccount = await LecAccount.findOne({ username })
      .populate({
        path: 'lecturerRef',
        populate: {
          path: 'department',
          model: 'Department'
        }
      });

      if (!lecAccount) {
        return res.status(404).json({ message: "Invalid Credentials" });
      }
  
      // Check password
      const isMatch = await bcrypt.compare(password, lecAccount.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const lecturer = lecAccount.lecturerRef[0];
      if(!lecturer._id){
        return res.status(401).json({ message: "Invalid Lecturer" });
      }

      const lec=Lecturer.findById(lecturer._id)
      if(lec){
        console.log('lec found ')
      }
  
      // Generate tokens
      const accessToken = jwt.sign(
        { 
          id: lecturer._id, 
          username: lecAccount.username,
          role: 'lecturer'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );
  
      const refreshToken = jwt.sign(
        { 
          id: lecturer._id, 
          username: lecAccount.username,
          role: 'lecturer'
        }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: '7d' }
      );
  
      // Set tokens in HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge:1 * 24 * 60 * 60 * 1000 // 1 day
      });
  
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('logged in ')
  
      // Respond with lecturer info
      res.status(200).json({
        message: "Login successful",
        lecturer: {
         lecturerProfileid: lecturer._id,
          name: lecturer.name,
          email: lecturer.email,
          staffNumber: lecturer.staffNumber,
          accountId:lecAccount._id,
          department: lecturer.department.name,
          isActive: lecturer.isActive,
          username: lecAccount.username,
          phoneNumber:lecturer.phoneNumber,
          role:"lecturer"

        }
      });
  
    } catch (error) {
      console.error('Lecturer login error:', error);
      res.status(500).json({ 
        message: "Internal server error", 
        error: error.message 
      });
    }
  };



exports.getLecturerUnits = async (req, res) => {
  try {
    // Get access token from cookies
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token",
        error: error.message
      });
    }

    // Get lecturer ID from decoded token
    const lecturerId =new mongoose.Types.ObjectId(decodedToken.id);

    // Find lecturer and populate units
    const lecturer = await Lecturer.findById(lecturerId);
    console.log('founded lecturer ',lecturer,decodedToken,lecturerId)

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found"
      });
    }

    // Check if lecturer is active
    if (!lecturer.isActive) {
      return res.status(403).json({
        message: "Lecturer account is not active"
      });
    }

    // Find all courses that contain the lecturer's units
    const courses = await Course.find({
      units: { $in: lecturer.units }
    }).populate({
      path: 'units',
      match: { _id: { $in: lecturer.units } },
      select: '_id name code description'
    });

    // Transform the data to include both unit and course information
    const unitsWithCourses = [];
    courses.forEach(course => {
      course.units.forEach(unit => {
        unitsWithCourses.push({
          unit: {
            _id: unit._id,
            name: unit.name,
            code: unit.code,
            description: unit.description
          },
          course: {
            _id: course._id,
            name: course.name,
            code: course.code
          }
        });
      });
    });

    res.status(200).json({
      message: "Units retrieved successfully",
      unitsWithCourses: unitsWithCourses,
      totalUnits: unitsWithCourses.length,
      totalCourses: courses.length
    });

  } catch (error) {
    console.error('Error getting lecturer units:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Controller for creating new assignment
exports.createAssignment = async (req, res) => {
    try {
        // Files are already handled by multer middleware
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No files uploaded"
            });
        }

        // Get lecturer ID from JWT token
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            // Clean up uploaded files if authentication fails
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(401).json({ message: "Authentication required" });
        }

        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const lecturerId = decodedToken.id;

        // Get array of filenames
        const fileNames = req.files.map(file => file.filename);

        // Create new course/assignment document
        const assignment = new Assignment({
            fileNames: fileNames,
            Title: req.body.title,
            lecRef: [lecturerId],
            unitCode: req.body.unit,
            submissionDeadline: req.body.deadline
        });

        await assignment.save();

        // Send success response
        res.status(201).json({
            message: "Assignment created successfully",
            assignment: {
                id: assignment._id,
                title: assignment.Title,
                unitCode: assignment.unitCode,
                deadline: assignment.submissionDeadline,
                fileNames: assignment.fileNames
            }
        });

    } catch (error) {
        // Clean up uploaded files if database operation fails
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        console.error('Assignment creation error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Controller to serve files
exports.getAssignmentFile = async (req, res) => {
    try {
        const fileName = req.params.fileName;
        const filePath = path.join(__dirname, '../uploads/assignments', fileName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        // Send file
        res.sendFile(filePath);

    } catch (error) {
        console.error('File serving error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Controller to delete assignment and associated files
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // Delete associated files
        assignment.fileNames.forEach(fileName => {
            const filePath = path.join(__dirname, '../uploads/assignments', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Delete assignment document
        await Assignment.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Assignment and associated files deleted successfully"
        });

    } catch (error) {
        console.error('Assignment deletion error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


exports.getLecturerAssignments = async (req, res) => {
    try {
        // Get lecturer ID from JWT token
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }

        // Verify token and extract lecturer ID
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const lecturerId = decodedToken.id;

        // Find all assignments where the lecturer is in lecRef array
        const assignments = await Assignment.find({
            lecRef: lecturerId
        }).sort({ 
            submissionDeadline: -1 // Sort by deadline in descending order
        });

        // Transform assignments data for client
        const transformedAssignments = assignments.map(assignment => ({
            id: assignment._id,
            title: assignment.Title,
            unitCode: assignment.unitCode,
            deadline: assignment.submissionDeadline,
            fileNames: assignment.fileNames,
            createdAt: assignment.createdAt
        }));

        // Group assignments by unit code for easier frontend handling
        const groupedAssignments = transformedAssignments.reduce((acc, assignment) => {
            if (!acc[assignment.unitCode]) {
                acc[assignment.unitCode] = [];
            }
            acc[assignment.unitCode].push(assignment);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                assignments: groupedAssignments,
                totalCount: assignments.length
            }
        });

    } catch (error) {
        console.error('Error fetching lecturer assignments:', error);
        
        // Handle JWT verification errors specifically
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Invalid token",
                error: error.message
            });
        }

        // Handle expired JWT tokens
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired",
                error: error.message
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            message: "Error fetching assignments",
            error: error.message
        });
    }
};


exports.createStudentAccount = async (req, res) => {
    try {
        const { studentNumber, username, email, password } = req.body;

        // Validate input
        if (!studentNumber || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if student exists in the system
        const existingStudent = await Student.findOne({ studentNumber });

        if (!existingStudent) {
            return res.status(404).json({ message: "Student not found in the system" });
        }

        // Check if student account already exists
        const existingAccount = await StudentAccount.findOne({
            $or: [
                { username },
                { email },
                { studentRef: existingStudent._id }
            ]
        });

        if (existingAccount) {
            return res.status(400).json({
                message: "Account already exists",
                ...(existingAccount.username === username && { reason: "Username already taken" }),
                ...(existingAccount.email === email && { reason: "Email already registered" }),
                ...(existingAccount.studentRef.equals(existingStudent._id) && { reason: "Account already created for this student" })
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new student account
        const newStudentAccount = new StudentAccount({
            username,
            email,
            password: hashedPassword,
            studentRef: existingStudent._id
        });

        // Save the account
        await newStudentAccount.save();

        // Generate tokens
        const accessToken = jwt.sign(
            {
                id: existingStudent._id,
                username: newStudentAccount.username,
                role: 'student'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            {
                id: existingStudent._id,
                username: newStudentAccount.username,
                role: 'student'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response
        res.status(201).json({
            message: "Student account created successfully",
            student: {
                studentProfileId: existingStudent._id,
                studentNumber: existingStudent.studentNumber,
                courseCode: existingStudent.courseCode,
                accountId: newStudentAccount._id,
                username: newStudentAccount.username,
                email: newStudentAccount.email,
                isActive: existingStudent.isActive,
                role:"student"
            }
        });

    } catch (error) {
        console.error('Student account creation error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.loginStudent = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the student account
        const studentAccount = await StudentAccount.findOne({ username })
            .populate('studentRef');

        if (!studentAccount) {
            return res.status(404).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, studentAccount.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const student = studentAccount.studentRef;

        // Generate tokens
        const accessToken = jwt.sign(
            {
                id: student._id,
                username: studentAccount.username,
                role: 'student'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            {
                id: student._id,
                username: studentAccount.username,
                role: 'student'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response
        res.status(200).json({
            message: "Login successful",
            student: {
                studentProfileId: student._id,
                studentNumber: student.studentNumber,
                courseCode: student.courseCode,
                accountId: studentAccount._id,
                username: studentAccount.username,
                email: studentAccount.email,
                isActive: student.isActive,
                role:"student"
            }
        });

    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


exports.getStudentCourseDetails = async (req, res) => {
    try {
      // Step 1: Extract the student's ID from the JWT token in the cookie
      console.log('Cookies:', req.cookies);
      const accessToken = req.cookies.accessToken;
  
      if (!accessToken) {
        return res.status(401).json({ message: "Authentication required" });
      }
  
      // Verify the token and extract the student's ID
      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      const studentId = decodedToken.id;
  
      // Step 2: Fetch the student's profile to get the course code
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      const courseCode = student.courseCode;
  
      // Step 3: Fetch the course details using the course code
      const course = await Course.findOne({ code: courseCode }).populate("units");
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      // Step 4: Extract unit IDs from the course
      const unitCodes = course.units.map((unit) => unit.code);
  
      // Step 5: Fetch assignments linked to these units
      const assignments = await Assignment.find({ unitCode: { $in: unitCodes } }).populate("lecRef");
  
      // Step 6: Prepare the response
      const response = {
        courseName: course.name,
        units: course.units.map((unit) => ({
          id: unit._id,
          name: unit.name,
          code:unit.code,
          assignments: assignments
            .filter((assignment) => assignment.unitCode === unit.code)
            .map((assignment) => ({
              Title: assignment.Title,
              fileNames: assignment.fileNames,
              submissionDeadline: assignment.submissionDeadline,
              lecturer: assignment.lecRef.map((lecturer) => ({
                id: lecturer._id,
                name: lecturer.name,
                email: lecturer.email,
              })),
            })),
        })),
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching student course details:", error);
  
      // Handle JWT verification errors
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
  
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };


  exports.downloadAssignmentFile = async (req, res) => {
    try {
      // Verify the JWT token
      const token = req.cookies.accessToken;
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }
  
    //   const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    //   if (!decodedToken) {
    //     return res.status(401).json({ message: "Invalid token" });
    //   }
  
      const fileName = req.params.fileName;
      const filePath = path.join(__dirname, '../uploads/assignments', fileName);
  
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
  
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'application/octet-stream');
  
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
  
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  exports.logout = async (req, res) => {
    try {
      // Clear the access token and refresh token cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        sameSite: 'strict',
      });
  
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        sameSite: 'strict',
      });
  
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
  
  exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username)
        // Find the student account
        const adminAccount = await AdminAccount.findOne({ username })

       
        if (!adminAccount) {
            return res.status(404).json({ message: "Invalid credentials" });
        }
        // Verify password
        const isMatch = await bcrypt.compare(password, adminAccount.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }


        // Generate tokens
        const accessToken = jwt.sign(
            {
                id: adminAccount._id,
                username: adminAccount.username,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            {
                id: adminAccount._id,
                username: adminAccount.username,
                role: 'admin'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response
        res.status(200).json({
            message: "Login successful",
            admin: {
                id: adminAccount._id,
                username: adminAccount.username,
                email: adminAccount.email,
                role:"admin"
            }
        });

    } catch (error) {
        console.error('admin login error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.postNotes = async (req, res) => {
  try {
      // Files are already handled by multer middleware
      if (!req.files || req.files.length === 0) {
          return res.status(400).json({
              message: "No files uploaded"
          });
      }

      // Get lecturer ID from JWT token
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
          // Clean up uploaded files if authentication fails
          req.files.forEach(file => {
              fs.unlinkSync(file.path);
          });
          return res.status(401).json({ message: "Authentication required" });
      }

      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      const lecturerId = decodedToken.id;

      // Get array of filenames
      const fileNames = req.files.map(file => file.filename);

      // Create new course/assignment document
      const notes = new Notes({
          fileNames: fileNames,
          Title: req.body.title,
          lecRef: [lecturerId],
          unitCode: req.body.unit,
      });

      await notes.save();

      // Send success response
      res.status(201).json({
          message: "Assignment created successfully",
          notes: {
              id: notes._id,
              title: notes.Title,
              unitCode: notes.unitCode,
              fileNames: notes.fileNames
          }
      });

  } catch (error) {
      // Clean up uploaded files if database operation fails
      if (req.files) {
          req.files.forEach(file => {
              fs.unlinkSync(file.path);
          });
      }
      console.error('Assignment creation error:', error);
      res.status(500).json({
          message: "Internal server error",
          error: error.message
      });
  }
};

exports.deleteNotes = async (req, res) => {
  try {
    console.log(req.params.id)
      const notes = await Notes.findById(req.params.id);
      
      if (!notes) {
          return res.status(404).json({ message: "notes not found" });
      }

      // Delete associated files
      notes.fileNames.forEach(fileName => {
          const filePath = path.join(__dirname, '../uploads/notes', fileName);
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
          }
      });

      // Delete assignment document
      await Notes.findByIdAndDelete(req.params.id);

      res.status(200).json({
          message: "Notes and associated files deleted successfully"
      });

  } catch (error) {
      console.error('Notes deletion error:', error);
      res.status(500).json({
          message: "Internal server error",
          error: error.message
      });
  }
};

exports.getNotes = async (req, res) => {
  try {
      // Get lecturer ID from JWT token
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
          return res.status(401).json({ 
              message: "Authentication required" 
          });
      }

      // Verify token and extract lecturer ID
      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      const lecturerId = decodedToken.id;

      // Find all assignments where the lecturer is in lecRef array
      const notes = await Notes.find({
          lecRef: lecturerId
      }).sort({ 
          submissionDeadline: -1 // Sort by deadline in descending order
      });

      // Transform assignments data for client
      const transformedNotes = notes.map(note => ({
          id: note._id,
          title: note.Title,
          unitCode: note.unitCode,
          fileNames: note.fileNames,
          createdAt: note.createdAt
      }));

      // Group assignments by unit code for easier frontend handling
      const groupedNotes = transformedNotes.reduce((acc, note) => {
          if (!acc[note.unitCode]) {
              acc[note.unitCode] = [];
          }
          acc[note.unitCode].push(note);
          return acc;
      }, {});

      res.status(200).json({
          success: true,
          data: {
              assignments: groupedNotes,
              totalCount: 1
          }
      });

  } catch (error) {
      console.error('Error fetching lecturer Notes:', error);
      
      // Handle JWT verification errors specifically
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
              message: "Invalid token",
              error: error.message
          });
      }

      // Handle expired JWT tokens
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
              message: "Token expired",
              error: error.message
          });
      }

      // Handle other errors
      res.status(500).json({
          success: false,
          message: "Error fetching notes",
          error: error.message
      });
  }
};


exports.getUnitDetails = async (req, res) => {
  try {
    const unitId = req.params.unitId;

    // Fetch the unit details
    const unit = await Units.findById(unitId);
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Find lecturers who have this unitId in their units array
    const lecturers = await Lecturer.find({
      units: { $in: [unitId] }
    }).select('name email phoneNumber staffNumber')
      .populate('department', 'name'); // Also populate department info if needed

    // Find notes linked to this unit
    const notes = await Notes.find({
      unitCode: unit.code
    }).populate({
      path: 'lecRef',
      select: 'name email staffNumber'
    });

    // Prepare the response
    const response = {
      unit: {
        name: unit.name,
        code: unit.code,
        description: unit.description
      },
      lecturers: lecturers.map(lecturer => ({
        id: lecturer._id,
        name: lecturer.name,
        email: lecturer.email,
        phoneNumber: lecturer.phoneNumber,
        staffNumber: lecturer.staffNumber,
        department: lecturer.department ? lecturer.department.name : null
      })),
      notes: notes.map(note => ({
        id: note._id,
        title: note.Title,
        fileNames: note.fileNames,
        lecturers: note.lecRef.map(lec => ({
          id: lec._id,
          name: lec.name,
          email: lec.email,
          staffNumber: lec.staffNumber
        }))
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching unit details:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

exports.downloadNotesFile = async (req, res) => {
  try {
    // Verify the JWT token
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../uploads/notes', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


exports.createCourse = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Check if course with code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ error: "Course code already exists" });
    }

    const course = new Course({
      name,
      code
    });

    const savedCourse = await course.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('units');
    res.status(200).json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unit Controllers
exports.createUnit = async (req, res) => {
  try {
    const { name, code, description, courseId } = req.body;
    
    // Check if unit code already exists
    const existingUnit = await Units.findOne({ code });
    if (existingUnit) {
      return res.status(400).json({ error: "Unit code already exists" });
    }

    const unit = new Units({
      name,
      code,
      description
    });

    const savedUnit = await unit.save();

    // Add unit to course
    if (courseId) {
      await Course.findByIdAndUpdate(
        courseId,
        { $push: { units: savedUnit._id } }
      );
    }

    res.status(201).json(savedUnit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    const units = await Units.find();
    res.status(200).json(units);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Student Controllers
exports.createStudent = async (req, res) => {
  try {
    const { studentNumber, courseCode, isActive } = req.body;
    
    // Check if student number already exists
    const existingStudent = await Student.findOne({ studentNumber });
    if (existingStudent) {
      return res.status(400).json({ error: "Student number already exists" });
    }

    // Check if course exists
    const courseExists = await Course.findOne({ code: courseCode });
    if (!courseExists) {
      return res.status(400).json({ error: "Course not found" });
    }

    const student = new Student({
      studentNumber,
      courseCode,
      isActive
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getStudentUnits = async (req, res) => {
  try {
      // Step 1: Extract the student's ID from the JWT token in the cookie
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
          return res.status(401).json({ message: "Authentication required" });
      }

      // Verify the token and extract the student's ID
      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      const studentId = decodedToken.id;

      // Step 2: Fetch the student's profile to get the course code
      const student = await Student.findById(studentId);

      if (!student) {
          return res.status(404).json({ message: "Student not found" });
      }

      const courseCode = student.courseCode;

      // Step 3: Fetch the course details using the course code
      const course = await Course.findOne({ code: courseCode }).populate("units");

      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

      // Step 4: Prepare the response with only the units
      const response = {
          courseName: course.name,
          units: course.units.map((unit) => ({
              id: unit._id,
              name: unit.name,
              code: unit.code,
              description: unit.description,
          })),
      };

      res.status(200).json(response);
  } catch (error) {
      console.error("Error fetching student course details:", error);

      // Handle JWT verification errors
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Invalid or expired token" });
      }

      res.status(500).json({ message: "Internal server error", error: error.message });
  }
};