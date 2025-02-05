const mongoose = require("mongoose");

const studentAccountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    studentRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudentAccount', studentAccountSchema);