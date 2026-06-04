const express = require("express");

const router =
express.Router();

const {
  addLab,
  getLabs,
} = require(
  "../controllers/labController"
);


// TEST
router.get("/test", (req, res) => {

  res.send(
    "Lab route working"
  );
});


// ADD LAB
router.post(
  "/add",
  addLab
);


// GET LABS
router.get(
  "/all",
  getLabs
);

module.exports = router;