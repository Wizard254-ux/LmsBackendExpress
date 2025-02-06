const { express } = require("../server");
const router=express.Router()
router.use(express.json())

const { upload, handleMulterError } = require('../Middleware/Multer');
const {refreshToken}=require('../Middleware/MiddleAuth')
const {loginLecturer,loginAdmin,logout,createLecturer,getLecturerUnits,downloadAssignmentFile,getStudentCourseDetails,loginStudent,createStudentAccount,getLecturerAssignments,createAssignment,getAssignmentFile,deleteAssignment}=require('../Controllers/Auth')

// Route to create new assignment with multiple files
router.post('/assignments', 
    upload.array('files', 5), // Allow up to 5 files
    handleMulterError,
    createAssignment
);

// Route to get assignment file
router.get('/assignments/file/:fileName', getAssignmentFile);

// Route to delete assignment and its files
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/', getLecturerAssignments);

router.use('/loginLecAccount',loginLecturer)
router.use('/createLecAccount',createLecturer)
router.use('/getLecUnits',getLecturerUnits)
router.use('/createStudentAccount',createStudentAccount)
router.use('/loginStudentAccount',loginStudent)
router.get('/getStudentCourseDetails',getStudentCourseDetails)
// Route for downloading assignment files
router.get('/download/:fileName', downloadAssignmentFile);
router.use('/logout', logout);
router.use('/loginAdmin', loginAdmin);
router.use('/refreshToken', refreshToken);


// router.use('/refreshToken',refreshToken)

module.exports=router