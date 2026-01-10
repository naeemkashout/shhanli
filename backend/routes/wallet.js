const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getBalance,
  deposit,
  getTransactions,
  getTransactionById,
} = require("../controllers/walletController");

router.get("/balance", protect, getBalance);
router.post("/deposit", protect, deposit);
router.get("/transactions", protect, getTransactions);
router.get("/transactions/:id", protect, getTransactionById);

module.exports = router;
