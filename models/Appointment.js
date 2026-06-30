const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

  // Patient

  patientName: {
    type: String,
    required: true,
  },

  patientPhone: {
    type: String,
    required: true,
  },

  // Doctor

  meetingId: {
  type: String,
  default: "",
},

prescriptionSent: {
  type: Boolean,
  default: false,
},

  doctorName: {
    type: String,
    required: true,
  },

  specialization: {
    type: String,
    default: "",
  },

  hospital: {
    type: String,
    default: "",
  },

  fees: {
    type: Number,
    default: 0,
  },

  // Appointment

  appointmentDate: {
    type: String,
    required: true,
  },

  appointmentTime: {
    type: String,
    required: true,
  },

  // Patient Details

  reason: {
    type: String,
    default: "",
  },

  symptoms: {
    type: String,
    default: "",
  },

  medicines: {
    type: String,
    default: "",
  },

  reports: [{
    type: String,
  }],

  // Status

  status: {
    type: String,
    default: "Pending",
  },

  paymentStatus: {
  type: String,
  default: "Pending",
},

consultationStatus: {
  type: String,
  default: "Pending",
},

meetingId: {
  type: String,
  default: "",
},

}, {
  timestamps: true,
});

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);