const mongoose = require("mongoose");

const sampleCollectorSchema = new mongoose.Schema(
  {
    // ==========================================
    // COLLECTOR DETAILS
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // LAB DETAILS
    // ==========================================

    labId: {
      type: String,
      required: true,
      trim: true,
    },

    labName: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // COLLECTOR STATUS
    // ==========================================

    status: {
      type: String,

      enum: [
        "Active",
        "Inactive",
      ],

      default: "Active",
    },

    // ==========================================
    // CURRENT AVAILABILITY
    // ==========================================

    availability: {
      type: String,

      enum: [
        "Available",
        "Busy",
      ],

      default: "Available",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SampleCollector",
  sampleCollectorSchema
);