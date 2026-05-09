const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  createShipment,
  getUserShipments,
  getShipmentById,
  trackShipment,
  cancelShipment,
  requestShipmentEdit,
} = require("../controllers/shipmentController");

const { packageImageUpload } = require("../middleware/packageImageUpload");

router.post("/", protect, packageImageUpload, createShipment);
router.get("/", protect, getUserShipments);
router.get("/track/:trackingNumber", trackShipment);
router.get("/:id", protect, getShipmentById);
router.put("/:id/cancel", protect, cancelShipment);
router.put("/:id/edit-request", protect, requestShipmentEdit);

module.exports = router;
