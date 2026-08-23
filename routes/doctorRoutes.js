const express = require("express");

const router = express.Router();

const {
    addDoctor,
    getDoctors,
    getDoctorProfile,
} = require("../controllers/doctorController");


// ================= TEST ROUTE =================

router.get("/test", (req, res) => {
    res.send("Doctor route working");
});


// ================= ADD DOCTOR =================

router.post(
    "/add",
    addDoctor
);


// ================= GET ALL DOCTORS =================

router.get(
    "/all",
    getDoctors
);


// ================= GET DOCTOR PROFILE BY PHONE =================

router.get(
    "/profile/:phone",
    getDoctorProfile
);


module.exports = router;