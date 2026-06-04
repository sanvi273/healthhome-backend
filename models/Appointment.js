const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

  patientName: String,
  patientPhone: String,

  doctorName: String,
  specialization: String,

  appointmentDate: String,
  appointmentTime: String,

  status: {
    type: String,
    default: "Pending",
  },

}, {
  timestamps: true,
});

module.exports =
mongoose.model(
  "Appointment",
  appointmentSchema
);