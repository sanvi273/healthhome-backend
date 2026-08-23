const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema(
  {
    // =====================================================
    // PATIENT DETAILS
    // =====================================================

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

    // =====================================================
    // TEST DETAILS
    // =====================================================

    tests: {
      type: [String],
      default: [],
    },

    // =====================================================
    // LAB DETAILS
    // =====================================================

    labId: {
      type: String,
      default: "",
    },

    labName: {
      type: String,
      default: "",
    },

    // Patient address
    // Mainly required for Home Collection
    address: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    // =====================================================
    // PATIENT UPLOADED PRESCRIPTION / IMAGE
    // =====================================================

    prescriptionImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // COLLECTION MODE
    //
    // 1. Home Collection
    // 2. Visit Laboratory
    // =====================================================

    collectionMode: {
      type: String,

      enum: [
        "Home Collection",
        "Visit Laboratory",
      ],

      default: "Home Collection",
    },

    // =====================================================
    // SAMPLE COLLECTOR
    //
    // Used only when collectionMode is
    // "Home Collection"
    // =====================================================

    collectorId: {
      type: String,
      default: "",
    },

    collectorName: {
      type: String,
      default: "",
    },

    collectorPhone: {
      type: String,
      default: "",
    },

    collectorStatus: {
      type: String,

      enum: [
        "Not Assigned",
        "Assigned",
        "On The Way",
        "Sample Collected",
      ],

      default: "Not Assigned",
    },

    // =====================================================
    // LAB ORDER STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "Pending",

        "Accepted",

        "Collector Assigned",

        "On The Way",

        "Sample Collected",

        "Sample Received",

        "In Progress",

        "Report Ready",

        "Completed",

        "Rejected",
      ],

      default: "Pending",
    },

    // =====================================================
    // LAB REPORT
    // =====================================================

    reportUrl: {
      type: String,
      default: "",
    },

    reportUploadedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LabOrder",
  labOrderSchema
);