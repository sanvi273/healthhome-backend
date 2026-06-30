const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      default: "",
    },

    medicineName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
    },

    price: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    // ==========================
    // Patient Details
    // ==========================
    patientId: {
      type: String,
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    patientPhone: {
      type: String,
      required: true,
    },

    // ==========================
    // Pharmacy Details
    // ==========================
    pharmacyId: {
      type: String,
      required: true,
    },

    pharmacyName: {
      type: String,
      default: "",
    },

    // ==========================
    // Delivery Details
    // ==========================
    address: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    prescriptionImage: {
      type: String,
      default: "",
    },

    // ==========================
    // Medicines
    // ==========================
    medicines: [medicineSchema],

    // ==========================
    // Pricing
    // ==========================
    totalAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Payment
    // ==========================
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // ==========================
    // Order Status
    // ==========================
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);