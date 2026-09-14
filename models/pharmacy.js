const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema(
  {
    // ============================================================
    // PHARMACY BASIC DETAILS
    // ============================================================

    name: {
      type: String,
      required: true,
    },

    shopType: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    // ============================================================
    // PHARMACY PROFILE
    // ============================================================

    rating: {
      type: Number,
      default: 4.5,
    },

    available: {
      type: Boolean,
      default: true,
    },

    image: {
      type: String,
      default: "",
    },

    // ============================================================
    // RAZORPAY MARKETPLACE / SETTLEMENT
    // ============================================================

    // Razorpay Linked Account ID
    //
    // Example:
    // acc_xxxxxxxxxxxxx
    //
    // This will be added only after the pharmacy is onboarded
    // with the appropriate Razorpay marketplace/Route setup.

    razorpayLinkedAccountId: {
      type: String,
      default: "",
      index: true,
    },

    // Whether this pharmacy has completed the required
    // Razorpay onboarding for receiving settlements.

    razorpayOnboarded: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // SETTLEMENT DETAILS
    // ============================================================

    settlementEnabled: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // BUSINESS / COMMISSION
    // ============================================================

    // HealthHome commission percentage.
    //
    // Example:
    // 10 means 10%
    //
    // Keep 0 until you decide the actual business commission.

    platformFeePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Pharmacy",
  pharmacySchema
);