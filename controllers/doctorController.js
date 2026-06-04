const Doctor =
require("../models/doctor");


// ================= ADD DOCTOR =================

const addDoctor = async (req, res) => {

    try {

        const doctor =
        await Doctor.create(req.body);

        res.status(201).json({

            success: true,

            message:
            "Doctor added successfully",

            doctor,
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,
        });
    }
};


// ================= GET ALL DOCTORS =================

const getDoctors = async (req, res) => {

    try {

        const doctors =
        await Doctor.find();

        res.status(200).json({

            success: true,

            doctors,
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,
        });
    }
};

module.exports = {

    addDoctor,
    getDoctors,
};