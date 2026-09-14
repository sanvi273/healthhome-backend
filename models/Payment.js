const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ============================================================
    // HEALTHHOME ORDER
    // ============================================================

    orderReferenceId: {
      type: String,
      default: "",
      index: true,
    },

    // ============================================================
    // RAZORPAY PAYMENT
    // ============================================================

    paymentId: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },

    orderId: {
      type: String,
      default: "",
      index: true,
    },

    signature: {
      type: String,
      default: "",
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
      default: "",
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
        "ONLINE",
        "COD",

        // Existing values kept for old records
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
        "Collected",
        "Refunded",
      ],
      default: "Pending",
    },

    // ============================================================
    // RAZORPAY PAYMENT STATUS
    // ============================================================

    razorpayStatus: {
      type: String,
      default: "",
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

    settlementId: {
      type: String,
      default: "",
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
    // COD COLLECTION
    // ============================================================

    cashCollected: {
      type: Boolean,
      default: false,
    },

    cashCollectedAt: {
      type: Date,
      default: null,
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