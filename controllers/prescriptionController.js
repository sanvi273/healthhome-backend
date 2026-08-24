console.log("🔥 CONTROLLER LOADED");

const PDFDocument = require("pdfkit");
const Prescription = require("../models/prescriptionModel");
const Appointment = require("../models/Appointment");

console.log("===== PRESCRIPTION SCHEMA =====");
console.log(Prescription.schema.obj);
console.log("===============================");


// ============================================================
// SAVE PRESCRIPTION
// ============================================================

const savePrescription = async (req, res) => {
  try {
    console.log("================================");
    console.log("SAVE PRESCRIPTION REQUEST");
    console.log("BODY:", req.body);
    console.log("LAB TESTS RAW:", req.body.labTests);
    console.log(
      "LAB TESTS TYPE:",
      typeof req.body.labTests
    );
    console.log("================================");


    // --------------------------------------------------------
    // COPY REQUEST
    // --------------------------------------------------------

    const data = {
      ...req.body,
    };


    // --------------------------------------------------------
    // LAB TESTS
    // --------------------------------------------------------

    let labTests = req.body.labTests;


    if (typeof labTests === "string") {
      try {
        labTests = JSON.parse(labTests);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid labTests JSON format.",
        });
      }
    }


    if (!Array.isArray(labTests)) {
      labTests = [];
    }


    data.labTests = labTests.map((test) => {

      if (typeof test === "string") {
        return {
          testName: test,
          priority: "Normal",
          note: "",
        };
      }


      return {
        testName:
          test.testName?.toString() ?? "",

        priority:
          test.priority?.toString() ??
          "Normal",

        note:
          test.note?.toString() ?? "",
      };
    });


    // --------------------------------------------------------
    // MEDICINES
    // --------------------------------------------------------

    let medicines = req.body.medicines;


    if (typeof medicines === "string") {
      try {
        medicines = JSON.parse(medicines);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicines JSON format.",
        });
      }
    }


    if (!Array.isArray(medicines)) {
      medicines = [];
    }


    data.medicines = medicines.map(
      (medicine) => {

        return {
          medicineId:
            medicine.medicineId
                ?.toString() ?? "",

          medicine:
            medicine.medicine
                ?.toString() ?? "",

          price:
            medicine.price
                ?.toString() ?? "",

          dose:
            medicine.dose
                ?.toString() ?? "",

          duration:
            medicine.duration
                ?.toString() ?? "",

          food:
            medicine.food
                ?.toString() ?? "",

          instruction:
            medicine.instruction
                ?.toString() ?? "",

          morning:
            medicine.morning === true,

          afternoon:
            medicine.afternoon === true,

          night:
            medicine.night === true,
        };
      }
    );


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      "NORMALIZED LAB TESTS:",
      data.labTests
    );

    console.log(
      "NORMALIZED MEDICINES:",
      data.medicines
    );


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    const prescription =
      await Prescription.create(data);


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({
      success: true,

      message:
        "Prescription Saved Successfully",

      prescription,
    });

  } catch (e) {

    console.error(
      "SAVE PRESCRIPTION ERROR:",
      e
    );

    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// ============================================================
// GET PATIENT PRESCRIPTIONS
// ============================================================

const getPatientPrescriptions =
  async (req, res) => {

    try {

      const prescriptions =
        await Prescription.find({
          patientId:
            req.params.patientId,
        }).sort({
          createdAt: -1,
        });


      res.json(
        prescriptions
      );

    } catch (e) {

      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  };


// ============================================================
// DOWNLOAD PRESCRIPTION PDF
// ============================================================

const downloadPrescription =
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const prescription =
        await Prescription.findById(id);


      if (!prescription) {

        return res.status(404).json({
          success: false,
          message:
            "Prescription not found",
        });
      }


      const doc =
        new PDFDocument({
          margin: 50,
        });


      res.setHeader(
        "Content-Type",
        "application/pdf"
      );


      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Prescription-${id}.pdf`
      );


      doc.pipe(res);


      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      doc
        .fontSize(22)
        .text(
          "HealthHome Prescription",
          {
            align: "center",
          }
        );


      doc.moveDown();


      // ------------------------------------------------------
      // PATIENT
      // ------------------------------------------------------

      doc
        .fontSize(13)
        .text(
          `Doctor : ${
            prescription.doctorName || ""
          }`
        );


      doc.text(
        `Patient : ${
          prescription.patientName || ""
        }`
      );


      doc.text(
        `Phone : ${
          prescription.patientPhone || ""
        }`
      );


      doc.text(
        `Diagnosis : ${
          prescription.diagnosis || ""
        }`
      );


      doc.moveDown();


      // ------------------------------------------------------
      // SYMPTOMS
      // ------------------------------------------------------

      if (
        prescription.symptoms &&
        prescription.symptoms.length > 0
      ) {

        doc
          .fontSize(14)
          .text("Symptoms");


        prescription.symptoms.forEach(
          (symptom) => {

            doc
              .fontSize(11)
              .text(
                `- ${symptom}`
              );
          }
        );


        doc.moveDown();
      }


      // ------------------------------------------------------
      // MEDICINES
      // ------------------------------------------------------

      doc
        .fontSize(14)
        .text("Medicines");


      if (
        prescription.medicines &&
        prescription.medicines.length > 0
      ) {

        prescription.medicines.forEach(
          (medicine) => {

            doc
              .fontSize(11)
              .text(
                `- ${
                  medicine.medicine || ""
                }`
              );


            doc.text(
              `  Dose: ${
                medicine.dose || ""
              }`
            );


            doc.text(
              `  Duration: ${
                medicine.duration || ""
              }`
            );


            doc.text(
              `  Food: ${
                medicine.food || ""
              }`
            );


            const times = [];


            if (
              medicine.morning
            ) {
              times.push(
                "Morning"
              );
            }


            if (
              medicine.afternoon
            ) {
              times.push(
                "Afternoon"
              );
            }


            if (
              medicine.night
            ) {
              times.push(
                "Night"
              );
            }


            if (times.length > 0) {

              doc.text(
                `  Time: ${
                  times.join(", ")
                }`
              );
            }


            if (
              medicine.instruction
            ) {

              doc.text(
                `  Instruction: ${
                  medicine.instruction
                }`
              );
            }


            doc.moveDown(0.5);
          }
        );

      } else {

        doc
          .fontSize(11)
          .text(
            "No medicines prescribed."
          );
      }


      doc.moveDown();


      // ------------------------------------------------------
      // LAB TESTS
      // ------------------------------------------------------

      doc
        .fontSize(14)
        .text("Lab Tests");


      if (
        prescription.labTests &&
        prescription.labTests.length > 0
      ) {

        prescription.labTests.forEach(
          (test) => {

            doc
              .fontSize(11)
              .text(
                `- ${
                  test.testName || ""
                }`
              );


            doc.text(
              `  Priority: ${
                test.priority || "Normal"
              }`
            );


            if (test.note) {

              doc.text(
                `  Note: ${
                  test.note
                }`
              );
            }


            doc.moveDown(0.5);
          }
        );

      } else {

        doc
          .fontSize(11)
          .text(
            "No lab tests prescribed."
          );
      }


      doc.moveDown();


      // ------------------------------------------------------
      // ADVICE
      // ------------------------------------------------------

      if (
        prescription.advice
      ) {

        doc
          .fontSize(14)
          .text("Advice");


        doc
          .fontSize(11)
          .text(
            prescription.advice
          );
      }


      doc.end();

    } catch (e) {

      console.error(
        "PDF ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  };


// ============================================================
// SEND PRESCRIPTION
// ============================================================

const sendPrescription =
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const prescription =
        await Prescription.findById(id);


      if (!prescription) {

        return res.status(404).json({
          success: false,
          message:
            "Prescription not found",
        });
      }


      prescription.status =
        "SENT";


      await prescription.save();


      if (
        prescription.appointmentId
      ) {

        await Appointment.findByIdAndUpdate(
          prescription.appointmentId,
          {
            prescriptionSent:
              true,
          }
        );
      }


      res.json({

        success: true,

        message:
          "Prescription sent successfully",

        prescription,
      });

    } catch (e) {

      console.error(
        "SEND PRESCRIPTION ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  };


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  savePrescription,
  getPatientPrescriptions,
  downloadPrescription,
  sendPrescription,
};

console.log(
  "✅ Prescription controller exports:",
  {
    savePrescription:
      typeof savePrescription,

    getPatientPrescriptions:
      typeof getPatientPrescriptions,

    downloadPrescription:
      typeof downloadPrescription,

    sendPrescription:
      typeof sendPrescription,
  }
);