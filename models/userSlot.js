const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  name: {
    type: String,
    required: true,
  },

  semester: {
    type: Number,
    required: true,
  },

  timetable: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("userSlot", userSchema);
