const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema({

  patientId: {
    type: String,
    required: true,
  },

  patientName: {
    type: String,
    required: true,
  },

  patientPhone: {
    type: String,
    default: "",
  },

  doctorName: {
    type: String,
    default: "",
  },

  tests: [{
    type: String,
  }],

  labId: {
    type: String,
    default: "",
  },

  labName: {
    type: String,
    default: "",
  },

  address: {
    type: String,
    default: "",
  },

  notes: {
    type: String,
    default: "",
  },

  prescriptionImage: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    default: "Pending",
  },

  reportUrl: {
    type: String,
    default: "",
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model(
  "LabOrder",
  labOrderSchema,
);