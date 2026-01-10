const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createShipment,
  getUserShipments,
  getShipmentById,
  trackShipment,
  cancelShipment,
} = require("../controllers/shipmentController");

router.post("/", protect, createShipment);
router.get("/", protect, getUserShipments);
router.get("/track/:trackingNumber", trackShipment);
router.get("/:id", protect, getShipmentById);
router.put("/:id/cancel", protect, cancelShipment);

module.exports = router;
