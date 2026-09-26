const mongoose = require("mongoose");

// ============================================================
// MEDICINE SUB-SCHEMA
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
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    // ORDER TYPE
    //
    // MEDICINE:
    // Patient directly selects medicines.
    //
    // PRESCRIPTION:
    // Patient uploads prescription and pharmacy
    // confirms medicines later.
    // ========================================================

    orderType: {
      type: String,
      enum: ["MEDICINE", "PRESCRIPTION"],
      default: "MEDICINE",
      index: true,
    },

    // ========================================================
    // PATIENT
    // ========================================================

    patientId: {
      type: String,
      default: "",
      trim: true,
    },

    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    patientPhone: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // PHARMACY
    // ========================================================

    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },

    pharmacyName: {
      type: String,
      required: true,
      trim: true,
    },

    pharmacyPhone: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // DELIVERY ADDRESS
    // ========================================================

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // MEDICINES
    //
    // Normal MEDICINE order:
    // At least one medicine is required.
    //
    // PRESCRIPTION order:
    // Empty array is allowed initially because the
    // pharmacy has not confirmed the prescription yet.
    // ========================================================

    medicines: {
      type: [medicineSchema],
      required: true,

      validate: {
        validator: function (value) {
          // --------------------------------------------------
          // PRESCRIPTION ORDER
          // --------------------------------------------------
          // Patient uploads prescription first.
          // Medicines are added later by pharmacy.

          if (
            this.orderType ===
            "PRESCRIPTION"
          ) {
            return Array.isArray(value);
          }

          // --------------------------------------------------
          // NORMAL MEDICINE ORDER
          // --------------------------------------------------
          // Must contain at least one medicine.

          return (
            Array.isArray(value) &&
            value.length > 0
          );
        },

        message:
          "At least one medicine is required for a medicine order.",
      },
    },

    // ========================================================
    // PRESCRIPTION IMAGE
    // ========================================================

    prescriptionImage: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // NOTES
    // ========================================================

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // AMOUNTS
    // ========================================================

    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // ========================================================
    // CURRENCY
    // ========================================================

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    // ========================================================
    // PAYMENT
    // ========================================================

    paymentMethod: {
      type: String,
      enum: [
        "ONLINE",
        "COD",
        "Cash on Delivery",
      ],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      default: "Pending",
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // PHARMACY / PLATFORM SETTLEMENT
    // ========================================================

    settlementStatus: {
      type: String,
      default: "Pending",
      trim: true,
    },

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
    // ACCEPTED TIME
    //
    // Used by Pharmacy Dashboard to show newest
    // accepted orders first.
    // ========================================================

    acceptedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // DELIVERY AGENT
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

    cashCollectedBy: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // CANCELLATION
    // ========================================================

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

// Quickly find pharmacy orders.
orderSchema.index({
  pharmacyId: 1,
  createdAt: -1,
});

// Quickly find patient orders.
orderSchema.index({
  patientPhone: 1,
  createdAt: -1,
});

// Quickly filter order type.
orderSchema.index({
  orderType: 1,
  status: 1,
});

// Quickly sort accepted orders.
orderSchema.index({
  acceptedAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const Order = mongoose.model(
  "Order",
  orderSchema
);

module.exports = Order;