const express = require("express");
const router = express.Router();
const { adminAuth, superAdminAuth } = require("../middleware/adminAuth");
const {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllShipments,
  updateShipmentStatus,
  getAllTransactions,
  getActivityLogs,
  exportToExcel,
} = require("../controllers/adminController");

// Dashboard
router.get("/stats", adminAuth, getDashboardStats);

// Users management
router.get("/users", adminAuth, getAllUsers);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", superAdminAuth, deleteUser);

// Shipments management
router.get("/shipments", adminAuth, getAllShipments);
router.put("/shipments/:id/status", adminAuth, updateShipmentStatus);

// Transactions
router.get("/transactions", adminAuth, getAllTransactions);

// Activity logs
router.get("/activity-logs", adminAuth, getActivityLogs);

// Export
router.get("/export/excel", adminAuth, exportToExcel);

module.exports = router;
