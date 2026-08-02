const Appointment = require("../models/Appointment");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
// ================= BOOK APPOINTMENT =================
exports.bookAppointment = async (req, res) => {
  try {
    console.log("BODY =", req.body);
    console.log("FILES =", req.files);

    const uploadedReports = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file,
          "appointment_reports"
        );

        uploadedReports.push(result.secure_url);
      }
    }

    const appointment = await Appointment.create({
      patientName: req.body.patientName,
      patientPhone: req.body.patientPhone,

      doctorId: req.body.doctorId || "",

      doctorName: req.body.doctorName,

      specialization: req.body.specialization || "",

      hospital: req.body.hospital || "",

      fees: Number(req.body.fees || 0),

      appointmentDate: req.body.appointmentDate,

      appointmentTime: req.body.appointmentTime,

      reports: uploadedReports,

      paymentStatus: req.body.paymentStatus || "Pending",

      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================= GET ALL APPOINTMENTS =================

exports.getAppointments = async (req, res) => {

  try {

    const appointments = await Appointment.find()

      .sort({

        createdAt: -1,

      });

    res.json({

      success: true,

      appointments,

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ================= GET APPOINTMENTS BY DOCTOR =================

exports.getDoctorAppointments = async (req, res) => {

  try {

    const { doctorName } = req.params;

    const appointments = await Appointment.find({
      doctorName,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      appointments,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ================= GET APPOINTMENTS BY PATIENT =================

exports.getPatientAppointments = async (req, res) => {

  try {

    const { patientPhone } = req.params;

    const appointments = await Appointment.find({
      patientPhone,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      appointments,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ================= GET SINGLE APPOINTMENT =================

exports.getAppointmentById = async (req, res) => {

  try {

    const appointment = await Appointment.findById(
      req.params.id
    );

    if (!appointment) {

      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

    }

    res.json({
      success: true,
      appointment,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ================= UPDATE APPOINTMENT STATUS =================

exports.updateAppointmentStatus = async (req, res) => {

  try {

    const { id } = req.params;

    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(

      id,

      {
        status,
      },

      {
        new: true,
      }

    );

    if (!appointment) {

      return res.status(404).json({

        success: false,

        message: "Appointment not found",

      });

    }

    res.json({

      success: true,

      message: "Status updated successfully",

      appointment,

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ================= UPDATE PAYMENT STATUS =================

exports.updatePaymentStatus = async (req, res) => {

  try {

    const { id } = req.params;

    const { paymentStatus } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(

      id,

      {
        paymentStatus,
      },

      {
        new: true,
      }

    );

    if (!appointment) {

      return res.status(404).json({

        success: false,

        message: "Appointment not found",

      });

    }

    res.json({

      success: true,

      message: "Payment status updated",

      appointment,

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ================= DELETE APPOINTMENT =================

exports.deleteAppointment = async (req, res) => {

  try {

    const appointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!appointment) {

      return res.status(404).json({

        success: false,

        message: "Appointment not found",

      });

    }

    res.json({

      success: true,

      message: "Appointment deleted successfully",

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ================= START CONSULTATION =================

exports.startConsultation = async (req, res) => {

  try {

    const appointment = await Appointment.findByIdAndUpdate(

      req.params.id,

      {
        consultationStatus: "Ready",
        meetingId: req.params.id,
      },

      {
        new: true,
      }

    );

    if (!appointment) {

      return res.status(404).json({

        success: false,

        message: "Appointment not found",

      });

    }

    res.json({

      success: true,

      message: "Consultation started",

      appointment,

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ================= JOIN CONSULTATION =================

exports.joinConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        consultationStatus: "Joined",
      },
      {
        new: true,
      }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

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
// ================= CHECK READY CONSULTATION =================

exports.checkReadyConsultation = async (req, res) => {

  try {

    const appointment = await Appointment.findOne({
      patientPhone: req.params.patientPhone,
      consultationStatus: "Ready",
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      appointment,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ================= COMPLETE CONSULTATION =================

exports.completeConsultation = async (req, res) => {

  try {

    const appointment = await Appointment.findByIdAndUpdate(

      req.params.id,

      {
        status: "Completed",
        consultationStatus: "Completed",
      },

      {
        new: true,
      }

    );

    if (!appointment) {

      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

    }

    res.json({
      success: true,
      message: "Consultation completed successfully",
      appointment,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
