const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // ================= Patient =================

    patientName: {
      type: String,
      required: true,
    },

    patientPhone: {
      type: String,
      required: true,
    },

    // ================= Doctor =================

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

    // ================= Appointment =================

    appointmentDate: {
      type: String,
      required: true,
    },

    appointmentTime: {
      type: String,
      required: true,
    },

    // ================= Uploaded Reports =================

    reports: [
      {
        fileName: {
          type: String,
          default: "",
        },

        fileUrl: {
          type: String,
          default: "",
        },

        fileType: {
          type: String,
          default: "",
        },
      },
    ],

    // ================= Video Consultation =================

    meetingId: {
      type: String,
      default: "",
    },

    consultationStatus: {
      type: String,
      default: "Pending",
    },

    prescriptionSent: {
      type: Boolean,
      default: false,
    },

    // ================= Payment =================

    paymentStatus: {
      type: String,
      default: "Pending",
    },

    // ================= Appointment Status =================

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);