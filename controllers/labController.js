const Lab =
require("../models/lab");


// ================= ADD LAB =================

const addLab = async (req, res) => {

  try {

    const lab =
    await Lab.create(req.body);

    res.status(201).json({

      success: true,

      message:
      "Lab added successfully",

      lab,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};


// ================= GET ALL LABS =================

const getLabs = async (req, res) => {

  try {

    const labs =
    await Lab.find();

    res.status(200).json({

      success: true,

      labs,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};

module.exports = {

  addLab,
  getLabs,
};