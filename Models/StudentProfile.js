const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentNumber: {
        type: String,
        required: true,
        unique: true
    },
    courseCode: {
        type: String,
        required: true
    },
    // Add any other basic student info fields
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
