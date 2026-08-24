const Appointment = require("../models/Appointment");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

// ============================================================
// BOOK APPOINTMENT
// ============================================================

exports.bookAppointment = async (req, res) => {
  try {
    console.log("=================================");
    console.log("BOOK APPOINTMENT");
    console.log("BODY =", req.body);
    console.log("FILES =", req.files);
    console.log("=================================");

    const {
      patientName,
      patientPhone,

      doctorId,
      doctorName,
      specialization,
      hospital,
      fees,

      consultationType,

      appointmentDate,
      appointmentTime,

      paymentStatus,
      razorpayOrderId,
      paymentId,
    } = req.body;

    // ========================================================
    // REQUIRED FIELDS
    // ========================================================

    if (
      !patientName ||
      !patientPhone ||
      !doctorId ||
      !doctorName ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient, doctor ID, doctor name, date and time are required",
      });
    }

    // ========================================================
    // VALIDATE CONSULTATION TYPE
    // ========================================================

    const finalConsultationType =
      consultationType === "Video Consultation"
        ? "Video Consultation"
        : "Hospital Visit";

    // ========================================================
    // CHECK DUPLICATE SLOT
    // ========================================================

    const existingAppointment =
      await Appointment.findOne({
        doctorId: doctorId.toString(),
        appointmentDate,
        appointmentTime,

        status: {
          $in: [
            "Pending",
            "Upcoming",
            "Accepted",
          ],
        },
      });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message:
          "This doctor has already been booked for this time slot",
      });
    }

    // ========================================================
    // UPLOAD PATIENT REPORTS
    // ========================================================

    const uploadedReports = [];

    if (
      req.files &&
      req.files.length > 0
    ) {
      for (const file of req.files) {
        const result =
          await uploadToCloudinary(
            file,
            "appointment_reports"
          );

        uploadedReports.push({
          fileName:
            file.originalname || "",

          fileUrl:
            result.secure_url || "",

          fileType:
            file.mimetype || "",
        });
      }
    }

    // ========================================================
    // CREATE APPOINTMENT
    // ========================================================
console.log("=================================");
console.log("FINAL APPOINTMENT DATA");
console.log("doctorId =", doctorId);
console.log("doctorId type =", typeof doctorId);
console.log("doctorName =", doctorName);
console.log("=================================");


    const appointment =
      await Appointment.create({
        // ---------------- Patient ----------------

        patientName,
        patientPhone,

        // ---------------- Doctor ----------------

        doctorId:
          doctorId.toString(),

        doctorName,

        specialization:
          specialization || "",

        hospital:
          hospital || "",

        fees:
          Number(fees || 0),

        // ---------------- Appointment ----------------

        consultationType:
          finalConsultationType,

        appointmentDate,
        appointmentTime,

        // ---------------- Reports ----------------

        reports:
          uploadedReports,

        // ---------------- Payment ----------------

        paymentStatus:
          paymentStatus || "Pending",

        razorpayOrderId:
          razorpayOrderId || "",

        paymentId:
          paymentId || "",

        // ---------------- Appointment Status ----------------

        status: "Pending",

        // ---------------- Video Consultation ----------------

        meetingId: "",

        consultationStatus:
          "Pending",

        prescriptionSent:
          false,
      });
console.log("=================================");
console.log("🔥 SAVED APPOINTMENT");
console.log("saved doctorId =", appointment.doctorId);
console.log("saved doctorName =", appointment.doctorName);
console.log("saved _id =", appointment._id);
console.log("=================================");
    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      message:
        "Appointment booked successfully",
      appointment,
    });

  } catch (error) {
    console.log(
      "BOOK APPOINTMENT ERROR:",
      error
    );

    // Duplicate MongoDB index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This doctor appointment slot is already booked",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET ALL APPOINTMENTS
// ============================================================

exports.getAppointments = async (
  req,
  res
) => {
  try {
    const appointments =
      await Appointment.find()
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      appointments,
    });

  } catch (error) {
    console.log(
      "GET ALL APPOINTMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET APPOINTMENTS BY DOCTOR ID
// ============================================================

exports.getDoctorAppointments = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.params.doctorId?.toString().trim();

    console.log("=================================");
    console.log("GET DOCTOR APPOINTMENTS");
    console.log("DOCTOR ID =", doctorId);
    console.log("=================================");

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // --------------------------------------------------------
    // First find the doctor using Doctor model
    // --------------------------------------------------------

    const Doctor = require("../models/doctor");

    const doctor = await Doctor.findById(
      doctorId
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorName =
      doctor.name?.toString().trim();

    console.log(
      "DOCTOR NAME =",
      doctorName
    );

    // --------------------------------------------------------
    // Find:
    //
    // 1. New appointments using doctorId
    //
    // OR
    //
    // 2. Old appointments that don't have doctorId
    //    but have the same doctorName
    // --------------------------------------------------------

    const appointments =
      await Appointment.find({
        $or: [

          // NEW APPOINTMENTS
          {
            doctorId: doctorId,
          },

          // OLD APPOINTMENTS
          // created before doctorId was added
          {
            $and: [
              {
                $or: [
                  {
                    doctorId: {
                      $exists: false,
                    },
                  },
                  {
                    doctorId: "",
                  },
                  {
                    doctorId: null,
                  },
                ],
              },

              {
                doctorName: doctorName,
              },
            ],
          },
        ],
      }).sort({
        createdAt: -1,
      });

    console.log(
      "DOCTOR APPOINTMENTS COUNT =",
      appointments.length
    );

    appointments.forEach(
      (appointment, index) => {
        console.log(
          `APPOINTMENT ${index + 1}:`
        );

        console.log(
          "ID =",
          appointment._id.toString()
        );

        console.log(
          "PATIENT =",
          appointment.patientName
        );

        console.log(
          "DOCTOR ID =",
          appointment.doctorId
        );

        console.log(
          "DOCTOR NAME =",
          appointment.doctorName
        );

        console.log(
          "STATUS =",
          appointment.status
        );
      }
    );

    console.log(
      "================================="
    );

    return res.json({
      success: true,
      appointments,
    });

  } catch (error) {
    console.log(
      "GET DOCTOR APPOINTMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET APPOINTMENTS BY PATIENT
// ============================================================

exports.getPatientAppointments = async (
  req,
  res
) => {
  try {
    const {
      patientPhone,
    } = req.params;

    const appointments =
      await Appointment.find({
        patientPhone,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      appointments,
    });

  } catch (error) {
    console.log(
      "GET PATIENT APPOINTMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET SINGLE APPOINTMENT
// ============================================================

exports.getAppointmentById = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findById(
        req.params.id
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      appointment,
    });

  } catch (error) {
    console.log(
      "GET APPOINTMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// UPDATE APPOINTMENT STATUS
// ============================================================

exports.updateAppointmentStatus = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      status,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message:
          "Status is required",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Upcoming",
      "Accepted",
      "Completed",
      "Cancelled",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment status",
      });
    }

    const appointment =
      await Appointment.findByIdAndUpdate(
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
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Appointment status updated successfully",
      appointment,
    });

  } catch (error) {
    console.log(
      "UPDATE APPOINTMENT STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

exports.updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      paymentStatus,
      paymentId,
      razorpayOrderId,
    } = req.body;

    const updateData = {};

    if (paymentStatus) {
      updateData.paymentStatus =
        paymentStatus;
    }

    if (paymentId) {
      updateData.paymentId =
        paymentId;
    }

    if (razorpayOrderId) {
      updateData.razorpayOrderId =
        razorpayOrderId;
    }

    const appointment =
      await Appointment.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        }
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Payment status updated",
      appointment,
    });

  } catch (error) {
    console.log(
      "UPDATE PAYMENT STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// DELETE APPOINTMENT
// ============================================================

exports.deleteAppointment = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findByIdAndDelete(
        req.params.id
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Appointment deleted successfully",
    });

  } catch (error) {
    console.log(
      "DELETE APPOINTMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// START VIDEO CONSULTATION
// ============================================================

exports.startConsultation = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findById(
        req.params.id
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    if (
      appointment.consultationType !==
      "Video Consultation"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This appointment is not a video consultation",
      });
    }

    const meetingId =
      appointment.meetingId ||
      `healthhome-${appointment._id}`;

    appointment.meetingId =
      meetingId;

    appointment.consultationStatus =
      "Ready";

    appointment.status =
      "Upcoming";

    await appointment.save();

    return res.json({
      success: true,
      message:
        "Video consultation started",
      appointment,
    });

  } catch (error) {
    console.log(
      "START CONSULTATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// JOIN VIDEO CONSULTATION
// ============================================================

exports.joinConsultation = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          consultationStatus:
            "Joined",
        },
        {
          new: true,
        }
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Joined consultation",
      appointment,
    });

  } catch (error) {
    console.log(
      "JOIN CONSULTATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// CHECK READY VIDEO CONSULTATION
// ============================================================

exports.checkReadyConsultation =
  async (req, res) => {
    try {
      const appointment =
        await Appointment.findOne({
          patientPhone:
            req.params.patientPhone,

          consultationStatus:
            "Ready",

          consultationType:
            "Video Consultation",

          status: {
            $nin: [
              "Completed",
              "Cancelled",
            ],
          },
        }).sort({
          createdAt: -1,
        });

      return res.json({
        success: true,
        appointment,
      });

    } catch (error) {
      console.log(
        "CHECK READY CONSULTATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


// ============================================================
// COMPLETE CONSULTATION
// ============================================================

exports.completeConsultation = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          status: "Completed",

          consultationStatus:
            "Completed",
        },
        {
          new: true,
        }
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Consultation completed successfully",
      appointment,
    });

  } catch (error) {
    console.log(
      "COMPLETE CONSULTATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};