const Appointment =
require("../models/Appointment");

exports.bookAppointment =
async (req, res) => {

  try {

    console.log("BODY:", req.body);

    const appointment =
    await Appointment.create(req.body);

    console.log("SAVED:", appointment);

    res.json({
      success: true,
      appointment,
    });

  } catch (error) {

    console.log("ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};