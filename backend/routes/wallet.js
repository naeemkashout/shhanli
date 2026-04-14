const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getBalance,
  deposit,
  requestWithdrawal,
  getTransactions,
  exportTransactionsExcel,
  getTransactionById,
} = require("../controllers/walletController");

router.get("/balance", protect, getBalance);
router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, requestWithdrawal);
router.get("/transactions", protect, getTransactions);
router.get("/transactions/export/excel", protect, exportTransactionsExcel);
router.get("/transactions/:id", protect, getTransactionById);

module.exports = router;
