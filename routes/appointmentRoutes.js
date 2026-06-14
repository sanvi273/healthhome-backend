const express = require("express");

const router = express.Router();

const {

  bookAppointment,

  getAppointments,

  getDoctorAppointments,

  getPatientAppointments,

  getAppointmentById,

  updateAppointmentStatus,

  updatePaymentStatus,

  deleteAppointment,

} = require(
  "../controllers/appointmentController"
);

// ================= BOOK APPOINTMENT =================

router.post(
  "/book",
  bookAppointment
);

// ================= GET ALL APPOINTMENTS =================

router.get(
  "/all",
  getAppointments
);

// ================= GET DOCTOR APPOINTMENTS =================

router.get(
  "/doctor/:doctorName",
  getDoctorAppointments
);

// ================= GET PATIENT APPOINTMENTS =================

router.get(
  "/patient/:patientPhone",
  getPatientAppointments
);

// ================= GET SINGLE APPOINTMENT =================

router.get(
  "/:id",
  getAppointmentById
);

// ================= UPDATE STATUS =================

router.put(
  "/status/:id",
  updateAppointmentStatus
);

// ================= UPDATE PAYMENT STATUS =================

router.put(
  "/payment/:id",
  updatePaymentStatus
);

// ================= DELETE APPOINTMENT =================

router.delete(
  "/:id",
  deleteAppointment
);

module.exports = router;