const express = require("express");

const router = express.Router();

const {
    addDoctor,
    getDoctors,
} = require(
    "../controllers/doctorController"
);


// TEST ROUTE
router.get("/test", (req, res) => {

    res.send(
        "Doctor route working"
    );
});


// ADD DOCTOR
router.post(
    "/add",
    addDoctor
);


// GET ALL DOCTORS
router.get(
    "/all",
    getDoctors
);

module.exports = router;