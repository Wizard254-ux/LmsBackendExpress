const mongoose = require("mongoose");

const Assignments = new mongoose.Schema({
  fileNames: { type:[String], required: true },
  Title: { type: String, required: true },
  lecRef: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecturer" }], // Array of Unit references
  unitCode:{type:String,required:true},
  submissionDeadline:{type:String,required:true}

});

module.exports = mongoose.model("Assignments", Assignments);
