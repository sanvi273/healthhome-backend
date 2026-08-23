const SampleCollector = require("../models/sampleCollector");

// ============================================================
// ADD COLLECTOR
// ============================================================

const addSampleCollector = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      labId,
      labName,
    } = req.body;

    if (!name || !phone || !labId) {
      return res.status(400).json({
        message:
          "Name, phone and labId are required",
      });
    }

    const collector =
      await SampleCollector.create({
        name,
        phone,
        address: address || "",
        labId,
        labName: labName || "",
      });

    res.status(201).json(collector);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ============================================================
// GET COLLECTORS FOR LAB
// ============================================================

const getSampleCollectors = async (req, res) => {
  try {
    const {
      labId,
    } = req.params;

    const collectors =
      await SampleCollector.find({
        labId,
      }).sort({
        createdAt: -1,
      });

    res.json(collectors);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ============================================================
// UPDATE COLLECTOR
// ============================================================

const updateSampleCollector = async (req, res) => {
  try {
    const collector =
      await SampleCollector.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!collector) {
      return res.status(404).json({
        message: "Collector not found",
      });
    }

    res.json(collector);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ============================================================
// DELETE COLLECTOR
// ============================================================

const deleteSampleCollector = async (req, res) => {
  try {
    const collector =
      await SampleCollector.findByIdAndDelete(
        req.params.id
      );

    if (!collector) {
      return res.status(404).json({
        message: "Collector not found",
      });
    }

    res.json({
      message: "Collector deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  addSampleCollector,
  getSampleCollectors,
  updateSampleCollector,
  deleteSampleCollector,
};