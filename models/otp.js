const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    // Phone number for which OTP was generated
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Hashed OTP
    otp: {
      type: String,
      required: true,
    },

    // OTP expiry time
  expiresAt: {
    type: Date,
    required: true,
},

    // Number of verification attempts
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete OTP after expiry
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports =
  mongoose.models.OTP ||
  mongoose.model("OTP", otpSchema);