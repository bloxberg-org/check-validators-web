const express = require("express");
const router = express.Router();

const ValidatorController = require("../controllers/validatorDetailsController");

router.get("/", ValidatorController.getValidators);

module.exports = router;
