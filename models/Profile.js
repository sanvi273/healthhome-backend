const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    age: String,
    gender: String,
    bloodGroup: String,
    height: String,
    weight: String,
    photo: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Profile", profileSchema);