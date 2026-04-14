const express = require("express");
const router = express.Router();
const {
  getShippingCompanies,
} = require("../controllers/shippingCompanyController");

router.get("/", getShippingCompanies);

module.exports = router;
