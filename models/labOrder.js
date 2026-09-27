const mongoose = require("mongoose");

// ==========================================================
// REPORT SCHEMA
// ==========================================================

const reportSchema = new mongoose.Schema(
  {
    reportName: {
      type: String,
      default: "",
      trim: true,
    },

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

    pageNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: false,
  }
);


// ==========================================================
// LAB ORDER SCHEMA
// ==========================================================

const labOrderSchema = new mongoose.Schema(
  {
    // ========================================================
    // PATIENT
    // ========================================================

    patientId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    patientPhone: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    doctorName: {
      type: String,
      default: "",
      trim: true,
    },


    // ========================================================
    // BOOKING
    // ========================================================

    bookingType: {
      type: String,

      enum: [
        "TEST",
        "PRESCRIPTION",
      ],

      default: "TEST",

      index: true,
    },

    tests: {
      type: [String],
      default: [],
    },


    // ========================================================
    // LAB
    // ========================================================

    labId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    labName: {
      type: String,
      default: "",
      trim: true,
    },


    // ========================================================
    // ADDRESS / COLLECTION
    // ========================================================

    address: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    collectionMode: {
      type: String,

      enum: [
        "Home Collection",
        "Visit Laboratory",
      ],

      default: "Home Collection",
    },


    // ========================================================
    // PAYMENT
    //
    // NORMAL TEST BOOKING
    // -------------------
    // Amount is calculated from the selected lab tests.
    //
    // PRESCRIPTION BOOKING
    // ---------------------
    // Initial amount = 0
    //
    // Because the laboratory first needs to:
    // 1. Review prescription
    // 2. Determine required tests
    // 3. Calculate final amount
    //
    // Payment status:
    // Pending = Payment not completed
    // Paid    = Payment completed
    // Failed  = Payment failed
    //
    // For prescription bookings, payment will happen
    // after the laboratory determines the final amount
    // and at the sample collection stage.
    // ========================================================

    totalAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    paymentStatus: {
      type: String,

      enum: [
        "Pending",
        "Paid",
        "Failed",
      ],

      default: "Pending",

      index: true,
    },

    razorpayOrderId: {
      type: String,

      default: "",

      index: true,
    },

    razorpayPaymentId: {
      type: String,

      default: "",

      index: true,
    },

    razorpaySignature: {
      type: String,

      default: "",
    },

    paymentRecordId: {
      type: String,

      default: "",
    },


    // ========================================================
    // PRESCRIPTION
    // ========================================================

    prescriptionImage: {
      type: String,

      default: "",
    },


    // ========================================================
    // SAMPLE COLLECTION
    // ========================================================

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


    // ========================================================
    // LAB PROCESS
    // ========================================================

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

      index: true,
    },


    // ========================================================
    // REPORTS
    // ========================================================

    reports: {
      type: [reportSchema],

      default: [],
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


// ==========================================================
// INDEXES
// ==========================================================

// Patient orders
labOrderSchema.index({
  patientPhone: 1,
  createdAt: -1,
});


// Lab dashboard
labOrderSchema.index({
  labId: 1,
  status: 1,
  createdAt: -1,
});


// Patient history
labOrderSchema.index({
  patientId: 1,
  createdAt: -1,
});


// Payment-related lookup
labOrderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});


// ==========================================================
// MODEL
// ==========================================================

module.exports = mongoose.model(
  "LabOrder",
  labOrderSchema
);