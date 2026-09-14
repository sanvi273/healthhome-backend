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
    //
    // Supports multiple report pages/files.
    //
    // Each uploaded report contains:
    //
    // reportName  -> Human-readable name entered by lab staff
    // fileName    -> Original/uploaded file name
    // fileUrl     -> Cloudinary URL
    // fileType    -> Image/PDF type
    // pageNumber  -> Report page number
    //
    // Example:
    //
    // reports: [
    //   {
    //     reportName: "CBC Report",
    //     fileName: "cbc.jpg",
    //     fileUrl: "https://...",
    //     fileType: "image/jpeg",
    //     pageNumber: 1
    //   },
    //
    //   {
    //     reportName: "Thyroid Report",
    //     fileName: "thyroid.jpg",
    //     fileUrl: "https://...",
    //     fileType: "image/jpeg",
    //     pageNumber: 2
    //   }
    // ]
    //
    // =====================================================

    reports: [
      {
        // -------------------------------------------------
        // HUMAN READABLE REPORT NAME
        // -------------------------------------------------
        //
        // Entered by Lab Staff.
        //
        // Examples:
        // CBC Report
        // Thyroid Report
        // Liver Function Test
        // Blood Sugar Report
        //
        reportName: {
          type: String,
          default: "",
          trim: true,
        },

        // -------------------------------------------------
        // ORIGINAL FILE NAME
        // -------------------------------------------------

        fileName: {
          type: String,
          default: "",
        },

        // -------------------------------------------------
        // CLOUDINARY FILE URL
        // -------------------------------------------------

        fileUrl: {
          type: String,
          default: "",
        },

        // -------------------------------------------------
        // FILE TYPE
        //
        // Examples:
        // image/jpeg
        // image/png
        // application/pdf
        //
        // -------------------------------------------------

        fileType: {
          type: String,
          default: "",
        },

        // -------------------------------------------------
        // PAGE NUMBER
        // -------------------------------------------------

        pageNumber: {
          type: Number,
          default: 1,
        },
      },
    ],

    // =====================================================
    // REPORT UPLOADED DATE/TIME
    // =====================================================

    reportUploadedAt: {
      type: Date,
      default: null,
    },
  },

  // =======================================================
  // TIMESTAMPS
  // =======================================================

  {
    timestamps: true,
  }
);

// =========================================================
// EXPORT MODEL
// =========================================================

module.exports = mongoose.model(
  "LabOrder",
  labOrderSchema
);