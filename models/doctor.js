const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  specialization: {
    type: String,
    required: true,
  },

  experience: {
    type: String,
    required: true,
  },

  fees: {
    type: String,
    required: true,
  },

  hospital: {
    type: String,
    required: true,
  },

  about: {
    type: String,
    default: "",
  },

});

module.exports =
mongoose.model(
  "Doctor",
  doctorSchema
);