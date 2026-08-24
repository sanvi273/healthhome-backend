const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ============================================================
    // RAZORPAY PAYMENT
    // ============================================================

    paymentId: {
      type: String,
      required: true,
      unique: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    signature: {
      type: String,
      required: true,
    },

    // ============================================================
    // USER
    // ============================================================

    userId: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },

    userPhone: {
      type: String,
      required: true,
    },

    // ============================================================
    // SERVICE
    // ============================================================

    serviceType: {
      type: String,
      enum: [
        "Doctor",
        "Medicine",
        "Lab",
      ],
      required: true,
    },

    serviceId: {
      type: String,
      required: true,
    },

    // ============================================================
    // PAYMENT AMOUNT
    // ============================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ============================================================
    // PAYMENT METHOD
    // ============================================================

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "Card",
        "Net Banking",
        "Wallet",
        "Other",
        "",
      ],
      default: "",
    },

    // ============================================================
    // PAYMENT STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Success",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    // ============================================================
    // SETTLEMENT
    // ============================================================

    settlementStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Settled",
        "Failed",
      ],
      default: "Pending",
    },

    // ============================================================
    // PROVIDER
    // Doctor / Lab / Pharmacy
    // ============================================================

    providerId: {
      type: String,
      default: "",
    },

    providerType: {
      type: String,
      enum: [
        "Doctor",
        "Lab",
        "Pharmacy",
        "",
      ],
      default: "",
    },

    // ============================================================
    // HEALTHHOME COMMISSION
    // ============================================================

    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    providerAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============================================================
    // REFUND
    // ============================================================

    refundId: {
      type: String,
      default: "",
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);