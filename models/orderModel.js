const mongoose = require("mongoose");

// ============================================================
// MEDICINE ITEM SCHEMA
// ============================================================

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
    },

    medicineName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Price captured from database at order creation time
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // price × quantity
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// ORDER SCHEMA
// ============================================================

const orderSchema = new mongoose.Schema(
  {
    // ========================================================
    // PATIENT DETAILS
    // ========================================================

    patientId: {
      type: String,
      default: "",
    },

    patientName: {
      type: String,
      required: true,
    },

    patientPhone: {
      type: String,
      required: true,
    },

    // ========================================================
    // PHARMACY DETAILS
    // ========================================================

    pharmacyId: {
      type: String,
      required: true,
    },

    pharmacyName: {
      type: String,
      default: "",
    },

    pharmacyPhone: {
      type: String,
      default: "",
    },

    // ========================================================
    // DELIVERY DETAILS
    // ========================================================

    address: {
      type: String,
      required: true,
    },

    // ========================================================
    // DELIVERY PARTNER DETAILS
    // ========================================================

    deliveryAgentName: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryAgentPhone: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryAgentAssigned: {
      type: Boolean,
      default: false,
    },

    deliveryAgentAssignedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },

    prescriptionImage: {
      type: String,
      default: "",
    },

    // ========================================================
    // MEDICINES
    // ========================================================

    medicines: {
      type: [medicineSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one medicine is required.",
      },
    },

    // ========================================================
    // PRICING
    // ========================================================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    deliveryFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Total amount patient actually has to pay
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    paymentMethod: {
      type: String,
      enum: [
        "ONLINE",
        "COD",

        // Keep old value for compatibility with existing orders
        "Cash on Delivery",
      ],
      default: "COD",
    },

    // ========================================================
    // PAYMENT STATUS
    // ========================================================

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Collected",
        "Refunded",
      ],
      default: "Pending",
    },

    // ========================================================
    // RAZORPAY DETAILS
    // ========================================================

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

    // ========================================================
    // PAYMENT RECORD REFERENCE
    // ========================================================

    paymentRecordId: {
      type: String,
      default: "",
    },

    // ========================================================
    // PHARMACY SETTLEMENT
    // ========================================================

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

    // ========================================================
    // HEALTHHOME PLATFORM COMMISSION
    // ========================================================

    platformFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Amount that belongs to pharmacy
    providerAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ========================================================
    // COD COLLECTION
    // ========================================================

    cashCollected: {
      type: Boolean,
      default: false,
    },

    cashCollectedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // ORDER STATUS
    // ========================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Packed",
        "Out for Delivery",
        "Delivered",
        "Rejected",
        "Cancelled",
      ],
      default: "Pending",
    },

    // ========================================================
    // CANCELLATION
    // ========================================================

    cancellationReason: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // REFUND
    // ========================================================

    refundId: {
      type: String,
      default: "",
    },

    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
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

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "Order",
  orderSchema
);