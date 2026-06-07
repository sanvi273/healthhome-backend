const Doctor =
require("../models/doctor");


// ================= ADD DOCTOR =================

const addDoctor = async (req, res) => {

    try {

        const existingDoctor =
            await Doctor.findOne({
               phone: req.body.phone,
            });

        if (existingDoctor) {

            existingDoctor.specialization =
                req.body.specialization;

            existingDoctor.experience =
                req.body.experience;

            existingDoctor.fees =
                req.body.fees;

            existingDoctor.hospital =
                req.body.hospital;

            existingDoctor.about =
                req.body.about;

            await existingDoctor.save();

            return res.status(200).json({

                success: true,

                message:
                    "Doctor updated successfully",

                doctor: existingDoctor,
            });
        }

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