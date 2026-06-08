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
  deleteMedicine,
  updateMedicine,
};

// ================= DELETE MEDICINE =================

const deleteMedicine = async (req, res) => {

  try {

    await Medicine.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({

      success: true,

      message:
      "Medicine deleted successfully",
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};

// ================= UPDATE MEDICINE =================

const updateMedicine = async (req, res) => {

  try {

    const medicine =
    await Medicine.findByIdAndUpdate(

      req.params.id,

      req.body,

      {
        new: true,
      }
    );

    res.status(200).json({

      success: true,

      message:
      "Medicine updated successfully",

      medicine,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};