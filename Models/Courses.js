const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }], // Array of Unit references
});

module.exports = mongoose.model("Course", courseSchema);
