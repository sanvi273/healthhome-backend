const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema({

  patientName: {
    type: String,
    required: true,
  },

  patientPhone: {
    type: String,
    required: true,
  },

  labId: {
    type: String,
    required: true,
  },

  labName: {
    type: String,
    required: true,
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