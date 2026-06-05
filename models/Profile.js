const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: String,
  name: String,
  age: String,
  gender: String,
  bloodGroup: String,
  height: String,
  weight: String,
  photo: String,
});

module.exports = mongoose.model(
  "Profile",
  profileSchema
);