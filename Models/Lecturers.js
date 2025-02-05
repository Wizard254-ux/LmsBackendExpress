const mongoose = require("mongoose");

const lecturerSchema = new mongoose.Schema({
  staffNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true ,unique:true},
  phoneNumber: { type: String, required: true ,unique:true},
  isActive: { type: Boolean, default:true},
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }, // Linked to Department model
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: false }], // Linked to Unit model
});

module.exports = mongoose.model("Lecturer", lecturerSchema);
