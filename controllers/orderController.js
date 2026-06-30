const Order = require("../models/orderModel");


// =============================
// Place Medicine Order
// =============================
const placeOrder = async (req, res) => {
  try {
    console.log("========== NEW ORDER ==========");
    console.log(req.body);

    const order = await Order.create(req.body);

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// Pharmacy Dashboard Orders
// =============================
const getPharmacyOrders = async (req, res) => {
  try {

    const pharmacyId = req.params.pharmacyId;

    console.log("========== GET ORDERS ==========");
    console.log("Pharmacy :", pharmacyId);

    const orders = await Order.find({
      pharmacyId,
    }).sort({
      createdAt: -1,
    });

    console.log("Total Orders :", orders.length);

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// Patient Orders
// =============================
const getPatientOrders = async (req, res) => {
  try {

    const phone = req.params.phone;

    const orders = await Order.find({
      patientPhone: phone,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// Update Order Status
// =============================
const updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      order,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// Get All Orders (Admin)
// =============================
const getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// Exports
// =============================
module.exports = {
  placeOrder,
  getPharmacyOrders,
  getPatientOrders,
  updateOrderStatus,
  getAllOrders,
};