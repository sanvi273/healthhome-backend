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
    // DELIVERY PARTNERS
    // ============================================================

    // Permanent delivery partners belonging to this pharmacy.
    // These are stored in MongoDB and will NOT disappear
    // when the pharmacy logs out.
    //
    // They will remain until the pharmacy explicitly deletes them.

    deliveryPartners: [
      {
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

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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

    razorpayLinkedAccountId: {
      type: String,
      default: "",
      index: true,
    },

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