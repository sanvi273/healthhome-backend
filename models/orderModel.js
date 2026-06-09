const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    pharmacyId: {
      type: String,
      required: true,
    },

    medicines: [
      {
        medicineName: String,
        quantity: Number,
      },
    ],

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);