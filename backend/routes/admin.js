const express = require("express");
const router = express.Router();
const {
  adminAuth,
  managementAuth,
  companyAdminAuth,
  superAdminAuth,
} = require("../middleware/adminAuth");
const {
  getDashboardStats,
  uploadCompanyLogo,
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  upsertCompanyAdminAccount,
  getMyCompany,
  updateMyCompany,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllShipments,
  getCancellationRequests,
  getEditRequests,
  updateShipmentStatus,
  reviewCancellationRequest,
  reviewEditRequest,
  getAllTransactions,
  reviewWithdrawalRequest,
  importComparisonInvoices,
  getActivityLogs,
  exportToExcel,
} = require("../controllers/adminController");
const { companyLogoUpload, excelUpload } = require("../middleware/upload");

const fallbackAdminHandler = (handlerName) => (req, res) => {
  res.status(503).json({
    success: false,
    message: `Admin service '${handlerName}' is currently unavailable`,
  });
};

const safeHandler = (handler, handlerName) =>
  typeof handler === "function" ? handler : fallbackAdminHandler(handlerName);

// Dashboard
router.get("/stats", managementAuth, safeHandler(getDashboardStats, "stats"));

// Company management
router.get(
  "/companies",
  adminAuth,
  safeHandler(getAllCompanies, "getAllCompanies"),
);
router.post(
  "/companies/upload-logo",
  adminAuth,
  companyLogoUpload,
  safeHandler(uploadCompanyLogo, "uploadCompanyLogo"),
);
router.post(
  "/companies",
  adminAuth,
  safeHandler(createCompany, "createCompany"),
);
router.get(
  "/companies/me",
  managementAuth,
  safeHandler(getMyCompany, "getMyCompany"),
);
router.put(
  "/companies/me",
  companyAdminAuth,
  safeHandler(updateMyCompany, "updateMyCompany"),
);
router.get(
  "/companies/:id",
  adminAuth,
  safeHandler(getCompanyById, "getCompanyById"),
);
router.put(
  "/companies/:id",
  adminAuth,
  safeHandler(updateCompany, "updateCompany"),
);
router.delete(
  "/companies/:id",
  adminAuth,
  safeHandler(deleteCompany, "deleteCompany"),
);
router.post(
  "/companies/:id/admin-account",
  adminAuth,
  safeHandler(upsertCompanyAdminAccount, "upsertCompanyAdminAccount"),
);

// Users management
router.get("/users", managementAuth, safeHandler(getAllUsers, "getAllUsers"));
router.put("/users/:id", managementAuth, safeHandler(updateUser, "updateUser"));
router.delete(
  "/users/:id",
  superAdminAuth,
  safeHandler(deleteUser, "deleteUser"),
);

// Shipments management
router.get(
  "/shipments",
  managementAuth,
  safeHandler(getAllShipments, "getAllShipments"),
);
router.get(
  "/cancellation-requests",
  managementAuth,
  safeHandler(getCancellationRequests, "getCancellationRequests"),
);
router.get(
  "/edit-requests",
  managementAuth,
  safeHandler(getEditRequests, "getEditRequests"),
);
router.put(
  "/shipments/:id/status",
  managementAuth,
  safeHandler(updateShipmentStatus, "updateShipmentStatus"),
);
router.put(
  "/shipments/:id/cancellation-request",
  managementAuth,
  safeHandler(reviewCancellationRequest, "reviewCancellationRequest"),
);
router.put(
  "/shipments/:id/edit-request",
  managementAuth,
  safeHandler(reviewEditRequest, "reviewEditRequest"),
);

// Transactions
router.get(
  "/transactions",
  managementAuth,
  safeHandler(getAllTransactions, "getAllTransactions"),
);
router.post(
  "/comparison-invoices/import",
  managementAuth,
  excelUpload,
  safeHandler(importComparisonInvoices, "importComparisonInvoices"),
);
router.put(
  "/transactions/:id/withdrawal-review",
  adminAuth,
  safeHandler(reviewWithdrawalRequest, "reviewWithdrawalRequest"),
);

// Activity logs
router.get(
  "/activity-logs",
  managementAuth,
  safeHandler(getActivityLogs, "getActivityLogs"),
);

// Export
router.get(
  "/export/excel",
  managementAuth,
  safeHandler(exportToExcel, "exportToExcel"),
);

module.exports = router;
