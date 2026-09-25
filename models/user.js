const mongoose = require("mongoose");

// ============================================================
// ADDRESS SUB-SCHEMA
// ============================================================

const addressSchema = new mongoose.Schema(
  {
    // Home / Work / College / Other
    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Complete readable address
    fullAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional landmark
    landmark: {
      type: String,
      default: "",
      trim: true,
    },

    // City
    city: {
      type: String,
      required: true,
      trim: true,
    },

    // State
    state: {
      type: String,
      required: true,
      trim: true,
    },

    // Pincode
    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    // GPS latitude
    latitude: {
      type: Number,
      default: null,
    },

    // GPS longitude
    longitude: {
      type: Number,
      default: null,
    },

    // Default address
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema(
  {
    // ==========================================================
    // BASIC USER INFORMATION
    // ==========================================================

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    // ==========================================================
    // ROLE
    // ==========================================================

    role: {
      type: String,

      enum: [
        "patient",
        "doctor",
        "laboratory",
        "pharmacy",
      ],

      required: true,
    },

    // ==========================================================
    // PHONE
    // ==========================================================

    phone: {
      type: String,
    },

    // ==========================================================
    // PROFILE IMAGE
    // ==========================================================

    profileImage: {
      type: String,
    },

    // ==========================================================
    // ONESIGNAL
    // ==========================================================

    oneSignalId: {
      type: String,
      default: "",
    },

    // ==========================================================
    // SAVED ADDRESSES
    // ==========================================================

    addresses: {
      type: [addressSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);