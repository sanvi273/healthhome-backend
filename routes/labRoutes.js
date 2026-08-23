const express = require("express");

const router = express.Router();

const {
  addLab,
  getLabs,
  getLabProfile,
} = require("../controllers/labController");


// ================= TEST =================

router.get("/test", (req, res) => {
  res.send("Lab route working");
});


// ================= ADD LAB =================

router.post(
  "/add",
  addLab
);


// ================= GET ALL LABS =================

router.get(
  "/all",
  getLabs
);


// ================= GET LAB PROFILE BY PHONE =================

router.get(
  "/profile/:phone",
  getLabProfile
);


module.exports = router;