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
  startConsultation,
  completeConsultation,
   joinConsultation,
  checkReadyConsultation,
} = require("../controllers/appointmentController");

console.log({
  startConsultation,
  completeConsultation,
  joinConsultation,
  checkReadyConsultation,
});

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

router.get(
  "/ready/:patientPhone",
  checkReadyConsultation
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

router.put(
  "/start-consultation/:id",
  startConsultation
);

router.put(
  "/complete/:id",
  completeConsultation
);

router.delete(
  "/:id",
  deleteAppointment
);

router.put(
  "/join/:id",
  joinConsultation,
);

module.exports = router;