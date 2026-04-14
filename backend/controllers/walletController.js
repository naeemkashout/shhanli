const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const { createAndEmitNotification } = require("./notificationController");
const ExcelJS = require("exceljs");

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

    await createAndEmitNotification(req, {
      userId: req.user.id,
      type: "wallet",
      titleAr: "إيداع في المحفظة",
      titleEn: "Wallet Deposit Completed",
      messageAr: `تم إيداع ${amount} ${currency} في محفظتك بنجاح.`,
      messageEn: `${amount} ${currency} has been deposited to your wallet successfully.`,
      metadata: {
        transactionId: transaction._id,
        amount,
        currency,
        method,
        balanceAfter: user.balance,
      },
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

// @desc    Create withdrawal request
// @route   POST /api/wallet/withdraw
// @access  Private
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, currency, method, notes } = req.body || {};

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!["USD", "SYP"].includes(String(currency || "").toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency",
      });
    }

    if (
      !["wallet", "cash", "card", "bank-transfer", "mobile-payment"].includes(
        String(method || ""),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method",
      });
    }

    const normalizedCurrency = String(currency).toUpperCase();
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentBalance = Number(user.balance?.[normalizedCurrency] || 0);
    if (parsedAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: "withdrawal",
      amount: parsedAmount,
      currency: normalizedCurrency,
      status: "pending",
      method,
      description: String(notes || "").trim() || "Withdrawal request",
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      processedAt: null,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "withdrawal",
      category: "wallet",
      description: `Requested withdrawal ${parsedAmount} ${normalizedCurrency}`,
      targetId: transaction._id,
      targetModel: "Transaction",
    });

    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("withdrawal-request-created", {
        transaction,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting withdrawal request",
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

// @desc    Export transaction history to Excel
// @route   GET /api/wallet/transactions/export/excel
// @access  Private
exports.exportTransactionsExcel = async (req, res) => {
  try {
    const { type, status, currency, search, dateFrom, dateTo, language } =
      req.query;
    const lang = String(language || "ar").toLowerCase() === "en" ? "en" : "ar";

    const labels = {
      ar: {
        sheetName: "سجل المعاملات",
        filePrefix: "transactions-ar",
        reference: "المرجع",
        type: "النوع",
        status: "الحالة",
        method: "طريقة الدفع",
        amount: "المبلغ",
        currency: "العملة",
        trackingNumber: "رقم التتبع",
        description: "الوصف",
        createdAt: "تاريخ الإنشاء",
        empty: "-",
      },
      en: {
        sheetName: "Transactions",
        filePrefix: "transactions-en",
        reference: "Reference",
        type: "Type",
        status: "Status",
        method: "Method",
        amount: "Amount",
        currency: "Currency",
        trackingNumber: "Tracking Number",
        description: "Description",
        createdAt: "Created At",
        empty: "-",
      },
    };

    const typeMap = {
      ar: {
        deposit: "إيداع",
        withdrawal: "سحب",
        payment: "دفع",
        refund: "استرداد",
        fee: "رسوم",
        commission: "عمولة",
      },
      en: {
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        payment: "Payment",
        refund: "Refund",
        fee: "Fee",
        commission: "Commission",
      },
    };

    const statusMap = {
      ar: {
        pending: "معلقة",
        completed: "مكتملة",
        failed: "فاشلة",
        cancelled: "ملغاة",
      },
      en: {
        pending: "Pending",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled",
      },
    };

    const methodMap = {
      ar: {
        wallet: "المحفظة",
        cash: "نقدي",
        card: "بطاقة",
        "bank-transfer": "تحويل بنكي",
        "mobile-payment": "محفظة إلكترونية",
      },
      en: {
        wallet: "Wallet",
        cash: "Cash",
        card: "Card",
        "bank-transfer": "Bank Transfer",
        "mobile-payment": "Mobile Wallet",
      },
    };

    const selectedLabels = labels[lang];

    const query = { userId: req.user.id };
    if (type && type !== "all") query.type = type;
    if (status && status !== "all") query.status = status;
    if (currency && currency !== "all") query.currency = currency;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom)
        query.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) query.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (search && String(search).trim()) {
      const searchRegex = { $regex: String(search).trim(), $options: "i" };
      query.$or = [
        { reference: searchRegex },
        { description: searchRegex },
        { method: searchRegex },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate("relatedShipment", "trackingNumber")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(selectedLabels.sheetName);

    worksheet.columns = [
      { header: selectedLabels.reference, key: "reference", width: 24 },
      { header: selectedLabels.type, key: "type", width: 14 },
      { header: selectedLabels.status, key: "status", width: 14 },
      { header: selectedLabels.method, key: "method", width: 18 },
      { header: selectedLabels.amount, key: "amount", width: 14 },
      { header: selectedLabels.currency, key: "currency", width: 12 },
      {
        header: selectedLabels.trackingNumber,
        key: "trackingNumber",
        width: 20,
      },
      { header: selectedLabels.description, key: "description", width: 40 },
      { header: selectedLabels.createdAt, key: "createdAt", width: 24 },
    ];

    worksheet.getRow(1).font = { bold: true };

    transactions.forEach((transaction) => {
      const localizedType =
        typeMap[lang][transaction.type] ||
        transaction.type ||
        selectedLabels.empty;
      const localizedStatus =
        statusMap[lang][transaction.status] ||
        transaction.status ||
        selectedLabels.empty;
      const localizedMethod =
        methodMap[lang][transaction.method] ||
        transaction.method ||
        selectedLabels.empty;

      worksheet.addRow({
        reference: transaction.reference || selectedLabels.empty,
        type: localizedType,
        status: localizedStatus,
        method: localizedMethod,
        amount: Number(transaction.amount || 0),
        currency: transaction.currency,
        trackingNumber:
          transaction.relatedShipment?.trackingNumber || selectedLabels.empty,
        description: transaction.description || selectedLabels.empty,
        createdAt: transaction.createdAt
          ? new Date(transaction.createdAt)
              .toISOString()
              .replace("T", " ")
              .slice(0, 19)
          : selectedLabels.empty,
      });
    });

    const fileName = `${selectedLabels.filePrefix}-${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting transactions",
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
