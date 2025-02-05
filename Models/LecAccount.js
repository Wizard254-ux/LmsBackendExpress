const mongoose = require("mongoose");

const LecAccount = new mongoose.Schema({
  username: { type: String,
    require:[true,'Please enter your username'],
    unique:true
  },
  password:{
    type:String,
    required:[true,"Please enter a password"],
    minlength:[8,"Password must be at least 8 characters long"]
},
  lecturerRef: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecturer" }], // Array of Unit references
});

module.exports = mongoose.model("LecAccount", LecAccount);
