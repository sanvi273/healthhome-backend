const Medicine =
require("../models/medicine");


// ================= ADD MEDICINE =================

const addMedicine = async (req, res) => {

  try {

    const medicine =
    await Medicine.create(req.body);

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

module.exports = {

  addMedicine,
  getMedicines,
};