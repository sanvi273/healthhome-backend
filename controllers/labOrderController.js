const LabOrder = require("../models/labOrder");

// Add Order
const addLabOrder = async (req, res) => {
  try {
    const order = await LabOrder.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Orders
const getLabOrders = async (req, res) => {
  try {
    const orders = await LabOrder.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Status
const updateLabOrderStatus = async (req, res) => {
  try {
    const order = await LabOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Upload Report
const uploadReport = async (req, res) => {
  try {
    const order = await LabOrder.findByIdAndUpdate(
      req.params.id,
      {
        reportUrl: req.body.reportUrl,
        status: "Completed",
      },
      {
        new: true,
      }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addLabOrder,
  getLabOrders,
  updateLabOrderStatus,
  uploadReport,
};