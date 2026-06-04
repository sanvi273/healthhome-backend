const Appointment =
require("../models/Appointment");

exports.bookAppointment =
async (req, res) => {

  try {

    const appointment =
    await Appointment.create(req.body);

    res.json({
      success: true,
      appointment,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};