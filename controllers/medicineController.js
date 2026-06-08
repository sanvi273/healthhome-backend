const Medicine =
require("../models/medicine");

// ================= ADD MEDICINE =================

const addMedicine = async (req, res) => {

try {

```
const medicine =
await Medicine.create(req.body);

res.status(201).json({

  success: true,

  message:
  "Medicine added successfully",

  medicine,
});
```

} catch (error) {

```
res.status(500).json({

  success: false,

  message: error.message,
});
```

}
};

// ================= GET ALL MEDICINES =================

const getMedicines = async (req, res) => {

  try {

    console.log("GET MEDICINES CALLED");

    const medicines =
      await Medicine.find();

    console.log(medicines);

    res.status(200).json({
      success: true,
      medicines,
    });

  } catch (error) {

    console.log("GET MEDICINES ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE MEDICINE =================

const deleteMedicine = async (req, res) => {

  try {

    console.log("DELETE REQUEST RECEIVED");
    console.log(req.params.id);

    const medicine =
      await Medicine.findByIdAndDelete(
        req.params.id
      );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });

  } catch (error) {

    console.log("DELETE ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE MEDICINE =================

const updateMedicine = async (req, res) => {

console.log("UPDATE REQUEST RECEIVED");
console.log(req.params.id);
console.log(req.body);

try {

```
const medicine =
await Medicine.findByIdAndUpdate(

  req.params.id,

  req.body,

  {
    new: true,
  }
);

res.status(200).json({

  success: true,

  message:
  "Medicine updated successfully",

  medicine,
});
```

} catch (error) {

```
console.log(error);

res.status(500).json({

  success: false,

  message: error.message,
});
```

}
};

module.exports = {

addMedicine,
getMedicines,
deleteMedicine,
updateMedicine,
};
