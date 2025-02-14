const mongoose = require("mongoose");

const Notes = new mongoose.Schema({
  fileNames: { type:[String], required: true },
  Title: { type: String, required: true },
  lecRef: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecturer" }], // Array of Unit references
  unitCode:{type:String,required:true},

});

module.exports = mongoose.model("Notes", Notes);
