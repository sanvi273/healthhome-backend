const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  patientId: String,

  patientName: String,

  pharmacyId: String,

  address: String,

  notes: String,

  prescriptionImage: String,

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

module.exports =
mongoose.model(
  "Order",
  orderSchema
);