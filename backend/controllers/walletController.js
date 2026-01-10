const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");

// @desc    Get wallet balance
// @route   GET /api/wallet/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching balance",
      error: error.message,
    });
  }
};

// @desc    Deposit to wallet
// @route   POST /api/wallet/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount, currency, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const user = await User.findById(req.user.id);
    const balanceBefore = user.balance[currency];

    user.balance[currency] += amount;
    await user.save();

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: "deposit",
      amount,
      currency,
      status: "completed",
      method,
      description: `Deposit to wallet`,
      balanceBefore,
      balanceAfter: user.balance[currency],
      processedAt: new Date(),
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "deposit",
      category: "wallet",
      description: `Deposited ${amount} ${currency}`,
      targetId: transaction._id,
      targetModel: "Transaction",
    });

    // Emit socket event
    const io = req.app.get("io");
    io.to("admin-room").emit("new-transaction", {
      transaction,
      user: req.user,
    });

    res.json({
      success: true,
      message: "Deposit successful",
      data: {
        transaction,
        newBalance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing deposit",
      error: error.message,
    });
  }
};

// @desc    Get transaction history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate("relatedShipment", "trackingNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/wallet/transactions/:id
// @access  Private
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("relatedShipment", "trackingNumber")
      .populate("processedBy", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Check ownership
    if (
      transaction.userId.toString() !== req.user.id &&
      !["admin", "super-admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this transaction",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};
