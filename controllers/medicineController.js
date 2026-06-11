const Medicine =
require("../models/medicine");

// ================= ADD MEDICINE =================

const addMedicine = async (req, res) => {
  try {

    const medicine = await Medicine.create({

      pharmacyPhone:
          req.body.pharmacyPhone,

      medicineName:
          req.body.medicineName,

      category:
          req.body.category,

      manufacturer:
          req.body.manufacturer,

      description:
          req.body.description,

      price:
          req.body.price,

      stock:
          req.body.stock,

      expiryDate:
          req.body.expiryDate,

      image:
          req.body.image,

      status:
          req.body.status ??
          "Available",
    });

    res.status(201).json({
      success: true,
      message:
          "Medicine added successfully",
      medicine,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= GET ALL MEDICINES =================

const getMedicines = async (req, res) => {

  try {

    const medicines =
      await Medicine.find();

    res.status(200).json({
      success: true,
      medicines,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET INVENTORY STATS =================

const getInventoryStats =
async (req, res) => {

  try {

    const medicines =
        await Medicine.find();

    const total =
        medicines.length;

    const lowStock =
        medicines.filter(
      (m) => m.stock < 10,
    ).length;

    const outOfStock =
        medicines.filter(
      (m) => m.stock <= 0,
    ).length;

    const available =
        medicines.filter(
      (m) =>
          m.status ==
          "Available",
    ).length;

    res.status(200).json({
      success: true,
      total,
      lowStock,
      outOfStock,
      available,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE MEDICINE =================

const deleteMedicine = async (req, res) => {
  try {
    console.log("DELETE REQUEST RECEIVED");
    console.log("ID:", req.params.id);

    const result = await Medicine.findByIdAndDelete(
      req.params.id.trim()
    );

    console.log("RESULT:", result);

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });

  } catch (error) {

    console.log("DELETE FULL ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE MEDICINE =================

const updateMedicine = async (req, res) => {
  try {

    console.log("UPDATE REQUEST RECEIVED");
    console.log(req.params.id);
    console.log(req.body);

    const medicine =
      await Medicine.findByIdAndUpdate(
        req.params.id,
        {
          medicineName: req.body.medicineName,
          price: req.body.price,
          stock: req.body.stock,
          description: req.body.description,
        },
        {
          new: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      medicine,
    });

  } catch (error) {

    console.log("UPDATE ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {

  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,
  getInventoryStats,
};
