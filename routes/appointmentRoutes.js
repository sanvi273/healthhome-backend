const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  bookAppointment,
  getAppointments,
  getDoctorAppointments,
  getPatientAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updatePaymentStatus,
  deleteAppointment,
  startConsultation,
  completeConsultation,
  joinConsultation,
  checkReadyConsultation,
} = require("../controllers/appointmentController");


// ============================================================
// BOOK APPOINTMENT
// POST /api/appointments/book
// ============================================================

router.post(
  "/book",
  upload.array("reports"),
  bookAppointment
);


// ============================================================
// GET ALL APPOINTMENTS
// GET /api/appointments/all
// ============================================================

router.get(
  "/all",
  getAppointments
);


// ============================================================
// GET DOCTOR APPOINTMENTS
// GET /api/appointments/doctor/:doctorName
// ============================================================

router.get(
  "/doctor/:doctorId",
  getDoctorAppointments
);


// ============================================================
// GET PATIENT APPOINTMENTS
// GET /api/appointments/patient/:patientPhone
// ============================================================

router.get(
  "/patient/:patientPhone",
  getPatientAppointments
);


// ============================================================
// CHECK READY VIDEO CONSULTATION
// GET /api/appointments/ready/:patientPhone
// ============================================================

router.get(
  "/ready/:patientPhone",
  checkReadyConsultation
);


// ============================================================
// UPDATE APPOINTMENT STATUS
// PUT /api/appointments/status/:id
// ============================================================

router.put(
  "/status/:id",
  updateAppointmentStatus
);


// ============================================================
// UPDATE PAYMENT STATUS
// PUT /api/appointments/payment/:id
// ============================================================

router.put(
  "/payment/:id",
  updatePaymentStatus
);


// ============================================================
// START VIDEO CONSULTATION
// PUT /api/appointments/start-consultation/:id
// ============================================================

router.put(
  "/start-consultation/:id",
  startConsultation
);


// ============================================================
// JOIN VIDEO CONSULTATION
// PUT /api/appointments/join/:id
// ============================================================

router.put(
  "/join/:id",
  joinConsultation
);


// ============================================================
// COMPLETE CONSULTATION
// PUT /api/appointments/complete/:id
// ============================================================

router.put(
  "/complete/:id",
  completeConsultation
);


// ============================================================
// GET SINGLE APPOINTMENT
// GET /api/appointments/:id
// ============================================================

router.get(
  "/:id",
  getAppointmentById
);


// ============================================================
// DELETE APPOINTMENT
// DELETE /api/appointments/:id
// ============================================================

router.delete(
  "/:id",
  deleteAppointment
);


module.exports = router;