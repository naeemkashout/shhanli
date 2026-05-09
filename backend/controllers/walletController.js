const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const { createAndEmitNotification } = require("./notificationController");
const ExcelJS = require("exceljs");

const PAYMERA_BASE_URL =
  process.env.PAYMERA_EGATE_BASE_URL || "https://egate-t.paymera.cc";
const PAYMERA_USERNAME = process.env.PAYMERA_EGATE_USERNAME || "";
const PAYMERA_PASSWORD = process.env.PAYMERA_EGATE_PASSWORD || "";
const PAYMERA_TERMINAL_ID = process.env.PAYMERA_EGATE_TERMINAL_ID || "";
const PAYMERA_CALLBACK_URL = process.env.PAYMERA_EGATE_CALLBACK_URL || "";
const PAYMERA_TRIGGER_URL = process.env.PAYMERA_EGATE_TRIGGER_URL || "";
const PAYMERA_DEFAULT_LANG = process.env.PAYMERA_EGATE_LANG || "en";

const SYRIATEL_BASE_URL = process.env.SYRIATEL_EPAYMENT_BASE_URL || "";
const SYRIATEL_USERNAME = process.env.SYRIATEL_EPAYMENT_USERNAME || "";
const SYRIATEL_PASSWORD = process.env.SYRIATEL_EPAYMENT_PASSWORD || "";
const SYRIATEL_MERCHANT_MSISDN =
  process.env.SYRIATEL_EPAYMENT_MERCHANT_MSISDN || "";
const SYRIATEL_GET_TOKEN_PATH =
  process.env.SYRIATEL_EPAYMENT_GET_TOKEN_PATH || "/getToken";
const SYRIATEL_PAYMENT_REQUEST_PATH =
  process.env.SYRIATEL_EPAYMENT_PAYMENT_REQUEST_PATH || "/paymentRequest";
const SYRIATEL_PAYMENT_CONFIRMATION_PATH =
  process.env.SYRIATEL_EPAYMENT_PAYMENT_CONFIRMATION_PATH ||
  "/paymentConfirmation";
const SYRIATEL_RESEND_OTP_PATH =
  process.env.SYRIATEL_EPAYMENT_RESEND_OTP_PATH || "/resendOTP";

const successStatusTokens = [
  "success",
  "successful",
  "paid",
  "completed",
  "approved",
  "done",
];

const failedStatusTokens = [
  "fail",
  "failed",
  "cancel",
  "cancelled",
  "declined",
  "expired",
  "error",
  "rejected",
];

const paymentIdPatterns = [
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  /[A-Za-z0-9_-]{12,}/,
];

const paymentIdKeyPatterns = [/payment[_-]?id/i, /transaction[_-]?id/i, /id$/i];

const urlKeyPatterns = [/payment[_-]?url/i, /redirect[_-]?url/i, /url$/i];

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const searchDeep = (value, predicate, seen = new Set()) => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string" || typeof value === "number") {
    return predicate(value) ? value : undefined;
  }

  if (!isPlainObject(value) && !Array.isArray(value)) return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = searchDeep(entry, predicate, seen);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (predicate(entry, key)) return entry;
    const found = searchDeep(entry, predicate, seen);
    if (found !== undefined) return found;
  }

  return undefined;
};

const extractUuidLike = (text) => {
  const str = String(text || "");
  for (const pattern of paymentIdPatterns) {
    const match = str.match(pattern);
    if (match?.[0]) return match[0];
  }
  return "";
};

const extractIdFromUrl = (text) => {
  const str = String(text || "").trim();
  if (!str) return "";

  const uuid = extractUuidLike(str);
  if (uuid) return uuid;

  try {
    const url = new URL(str);
    const queryCandidates = [
      "paymentId",
      "payment_id",
      "paymentID",
      "transactionId",
      "transaction_id",
      "id",
    ];

    for (const key of queryCandidates) {
      const value = url.searchParams.get(key);
      if (value) {
        const inferred = extractUuidLike(value) || String(value).trim();
        if (inferred) return inferred;
      }
    }

    const segments = url.pathname.split("/").filter(Boolean);
    for (const segment of segments) {
      const inferred = extractUuidLike(segment) || String(segment).trim();
      if (inferred && inferred.length >= 8) return inferred;
    }
  } catch {
    // not a URL
  }

  return "";
};

const getGatewayPrimitiveMatch = (payload, keyPatterns, valueMatcher) => {
  const found = searchDeep(payload, (entry, key) => {
    if (
      typeof key === "string" &&
      keyPatterns.some((pattern) => pattern.test(key))
    ) {
      if (valueMatcher(String(entry || ""))) return true;
    }
    return false;
  });

  return found !== undefined ? String(found) : "";
};

const sanitizePaymeraPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const cloned = Array.isArray(payload) ? [...payload] : { ...payload };

  if (Object.prototype.hasOwnProperty.call(cloned, "password")) {
    cloned.password = "[masked]";
  }

  if (Object.prototype.hasOwnProperty.call(cloned, "username")) {
    cloned.username = "[masked]";
  }

  if (Object.prototype.hasOwnProperty.call(cloned, "terminalId")) {
    cloned.terminalId = String(cloned.terminalId || "");
  }

  return cloned;
};

const logPaymera = (phase, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[PAYMERA][${timestamp}][${phase}]`, details);
};

const sanitizeSyriatelPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const cloned = Array.isArray(payload) ? [...payload] : { ...payload };

  if (Object.prototype.hasOwnProperty.call(cloned, "password")) {
    cloned.password = "[masked]";
  }

  if (Object.prototype.hasOwnProperty.call(cloned, "token")) {
    cloned.token = "[masked]";
  }

  return cloned;
};

const logSyriatel = (phase, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[SYRIATEL][${timestamp}][${phase}]`, details);
};

const getSyriatelErrorInfo = (payload) => {
  const errorCode = String(
    payload?.errorCode ?? payload?.data?.errorCode ?? payload?.code ?? "",
  ).trim();
  const errorDesc = String(
    payload?.errorDesc ??
      payload?.errorDescription ??
      payload?.message ??
      payload?.data?.errorDesc ??
      payload?.data?.errorDescription ??
      "",
  ).trim();

  return { errorCode, errorDesc };
};

const isSyriatelFinalConfirmationError = (errorCode) =>
  ["-95", "-98", "-103", "-105"].includes(String(errorCode || "").trim());

const callSyriatel = async ({ path, body }) => {
  if (!SYRIATEL_BASE_URL) {
    throw new Error("Syriatel ePayment base URL is not configured");
  }

  const base = SYRIATEL_BASE_URL.replace(/\/$/, "");

  logSyriatel("REQUEST", {
    url: `${base}${path}`,
    body: sanitizeSyriatelPayload(body),
  });

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  logSyriatel("RESPONSE", {
    url: `${base}${path}`,
    status: response.status,
    ok: response.ok,
    raw: text,
    parsed: data,
  });

  if (!response.ok) {
    logSyriatel("ERROR", {
      url: `${base}${path}`,
      status: response.status,
      parsed: data,
    });
    throw new Error(
      data?.errorDesc ||
        data?.message ||
        `Syriatel request failed (${response.status})`,
    );
  }

  return data;
};

const getSyriatelToken = async () => {
  if (!SYRIATEL_USERNAME || !SYRIATEL_PASSWORD) {
    throw new Error("Syriatel ePayment credentials are not configured");
  }

  const response = await callSyriatel({
    path: SYRIATEL_GET_TOKEN_PATH,
    body: {
      username: SYRIATEL_USERNAME,
      password: SYRIATEL_PASSWORD,
    },
  });

  const { errorCode, errorDesc } = getSyriatelErrorInfo(response);
  if (errorCode !== "0") {
    const error = new Error(errorDesc || "Failed to retrieve Syriatel token");
    error.syriatelErrorCode = errorCode;
    throw error;
  }

  const token = String(response?.token || response?.data?.token || "").trim();
  if (!token) {
    throw new Error("Syriatel token was not returned by getToken");
  }

  return token;
};

const getSyriatelMerchantPayload = (token) => {
  if (!SYRIATEL_MERCHANT_MSISDN) {
    throw new Error("Syriatel merchant MSISDN is not configured");
  }

  return {
    token,
    merchantMSISDN: SYRIATEL_MERCHANT_MSISDN,
  };
};

const getGatewayStatusText = (payload) => {
  const rawStatus =
    payload?.status ||
    payload?.payment_status ||
    payload?.paymentStatus ||
    payload?.data?.status ||
    payload?.data?.payment_status ||
    payload?.data?.paymentStatus ||
    "";

  return String(rawStatus || "")
    .toLowerCase()
    .trim();
};

const isGatewaySuccess = (statusText) =>
  successStatusTokens.some((token) => statusText.includes(token));

const isGatewayFailed = (statusText) =>
  failedStatusTokens.some((token) => statusText.includes(token));

const getGatewayPaymentId = (payload) => {
  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.response,
    payload?.payload,
  ];

  for (const candidate of candidates) {
    const directMatch = searchDeep(candidate, (entry, key) => {
      if (
        !key ||
        !paymentIdKeyPatterns.some((pattern) => pattern.test(String(key)))
      ) {
        return false;
      }

      if (entry === null || entry === undefined) return false;
      const inferred = extractIdFromUrl(entry) || String(entry).trim();
      return Boolean(inferred);
    });

    if (directMatch !== undefined) {
      const inferred =
        extractIdFromUrl(directMatch) || String(directMatch).trim();
      if (inferred) return inferred;
    }
  }

  const rawText =
    typeof payload === "string"
      ? payload
      : typeof payload?.raw === "string"
        ? payload.raw
        : JSON.stringify(payload || {});

  return extractIdFromUrl(rawText);
};

const getGatewayPaymentUrl = (payload) => {
  const url = searchDeep(payload, (entry, key) => {
    if (!key || !urlKeyPatterns.some((pattern) => pattern.test(String(key)))) {
      return false;
    }

    return Boolean(String(entry || "").trim());
  });

  if (url !== undefined) {
    return String(url);
  }

  if (typeof payload === "string" && /^https?:\/\//i.test(payload)) {
    return payload;
  }

  return "";
};

const callPaymera = async ({ method, path, body }) => {
  if (!PAYMERA_USERNAME || !PAYMERA_PASSWORD || !PAYMERA_TERMINAL_ID) {
    throw new Error("Paymera eGate credentials are not configured");
  }

  const base = PAYMERA_BASE_URL.replace(/\/$/, "");
  const authToken = Buffer.from(
    `${PAYMERA_USERNAME}:${PAYMERA_PASSWORD}`,
  ).toString("base64");

  logPaymera("REQUEST", {
    method,
    url: `${base}${path}`,
    body: sanitizePaymeraPayload(body),
  });

  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  logPaymera("RESPONSE", {
    method,
    url: `${base}${path}`,
    status: response.status,
    ok: response.ok,
    raw: text,
    parsed: data,
  });

  if (!response.ok) {
    logPaymera("ERROR", {
      method,
      url: `${base}${path}`,
      status: response.status,
      parsed: data,
    });
    throw new Error(
      data?.message ||
        data?.error ||
        `Paymera request failed (${response.status})`,
    );
  }

  return data;
};

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

// @desc    Create deposit request using Syriatel Cash or Paymera
// @route   POST /api/wallet/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount, currency, provider } = req.body || {};
    const normalizedProvider = String(provider || "syriatel-cash")
      .trim()
      .toLowerCase();
    const isPaymeraProvider = ["paymera", "paymera-egate"].includes(
      normalizedProvider,
    );

    const parsedAmount = Number(amount);
    const normalizedCurrency = String(currency || "").toUpperCase();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!["USD", "SYP"].includes(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const missingSyriatelConfig = [
      SYRIATEL_BASE_URL,
      SYRIATEL_USERNAME,
      SYRIATEL_PASSWORD,
      SYRIATEL_MERCHANT_MSISDN,
    ].some((value) => !String(value || "").trim());

    if (!isPaymeraProvider && missingSyriatelConfig) {
      return res.status(400).json({
        success: false,
        message:
          "Syriatel Cash is not configured. Please set SYRIATEL_EPAYMENT_BASE_URL, SYRIATEL_EPAYMENT_USERNAME, SYRIATEL_EPAYMENT_PASSWORD, and SYRIATEL_EPAYMENT_MERCHANT_MSISDN in backend/.env.",
      });
    }

    if (isPaymeraProvider) {
      const gatewayResponse = await callPaymera({
        method: "POST",
        path: "/api/create-payment",
        body: {
          lang: PAYMERA_DEFAULT_LANG,
          terminalId: PAYMERA_TERMINAL_ID,
          amount: parsedAmount,
          callbackURL: PAYMERA_CALLBACK_URL,
          triggerURL: PAYMERA_TRIGGER_URL,
          notes: `Wallet deposit for user ${req.user.id} (${normalizedCurrency})`,
        },
      });

      const externalPaymentId = getGatewayPaymentId(gatewayResponse);
      const paymentUrl = getGatewayPaymentUrl(gatewayResponse);

      if (!externalPaymentId) {
        return res.status(502).json({
          success: false,
          message: "Unable to retrieve payment ID from gateway",
          data: { gatewayResponse },
        });
      }

      const balanceBefore = Number(user.balance?.[normalizedCurrency] || 0);

      const transaction = await Transaction.create({
        userId: req.user.id,
        type: "deposit",
        amount: parsedAmount,
        currency: normalizedCurrency,
        status: "pending",
        method: "mobile-payment",
        description: "Paymera eGate deposit pending",
        balanceBefore,
        balanceAfter: balanceBefore,
        metadata: {
          gateway: "paymera-egate",
          externalPaymentId,
          paymentUrl,
        },
        processedAt: null,
      });

      const io = req.app.get("io");
      if (io) {
        io.to("admin-room").emit("new-transaction", {
          transaction,
          user: req.user,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Deposit payment created",
        data: {
          transactionId: transaction._id,
          paymentId: externalPaymentId,
          paymentUrl,
          status: transaction.status,
          provider: "paymera",
        },
      });
    }

    const balanceBefore = Number(user.balance?.[normalizedCurrency] || 0);

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: "deposit",
      amount: parsedAmount,
      currency: normalizedCurrency,
      status: "pending",
      method: "mobile-payment",
      description: "Syriatel Cash deposit pending",
      balanceBefore,
      balanceAfter: balanceBefore,
      metadata: {
        gateway: "syriatel-epayment",
        customerMsisdn: String(user.phone || "").trim(),
        merchantMsisdn: SYRIATEL_MERCHANT_MSISDN,
        syriatelTransactionId: "",
        syriatelStatus: "request-pending",
      },
      processedAt: null,
    });

    const customerMSISDN = String(user.phone || "").trim();
    if (!customerMSISDN) {
      transaction.status = "failed";
      transaction.description = "Syriatel Cash customer MSISDN is missing";
      transaction.processedAt = new Date();
      transaction.metadata.set("syriatelStatus", "failed");
      transaction.metadata.set(
        "syriatelLastError",
        "Customer MSISDN is missing",
      );
      await transaction.save();

      return res.status(400).json({
        success: false,
        message: "Customer MSISDN is missing",
      });
    }

    const token = await getSyriatelToken();
    const gatewayResponse = await callSyriatel({
      path: SYRIATEL_PAYMENT_REQUEST_PATH,
      body: {
        ...getSyriatelMerchantPayload(token),
        customerMSISDN,
        amount: String(parsedAmount),
        transactionID: String(transaction._id),
      },
    });

    const { errorCode, errorDesc } = getSyriatelErrorInfo(gatewayResponse);
    if (errorCode !== "0") {
      transaction.status = "failed";
      transaction.description = "Syriatel Cash payment request failed";
      transaction.processedAt = new Date();
      transaction.metadata.set("syriatelStatus", "request-failed");
      transaction.metadata.set("syriatelLastErrorCode", errorCode || "");
      transaction.metadata.set(
        "syriatelLastError",
        errorDesc || "Payment request failed",
      );
      await transaction.save();

      return res.status(502).json({
        success: false,
        message: errorDesc || "Syriatel payment request failed",
        data: {
          gatewayResponse,
          transactionId: String(transaction._id),
        },
      });
    }

    transaction.metadata.set("syriatelTransactionId", String(transaction._id));
    transaction.metadata.set("syriatelStatus", "otp-sent");
    transaction.metadata.set("syriatelLastError", "");
    await transaction.save();

    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("new-transaction", {
        transaction,
        user: req.user,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Deposit request created",
      data: {
        transactionId: transaction._id,
        paymentId: String(transaction._id),
        status: transaction.status,
        otpRequired: true,
        customerMSISDN,
        provider: "syriatel-cash",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating deposit payment",
      error: error.message,
    });
  }
};

// @desc    Check Syriatel Cash deposit status
// @route   GET /api/wallet/deposit/status/:paymentId
// @access  Private
exports.checkDepositStatus = async (req, res) => {
  try {
    const paymentId = String(req.params.paymentId || "").trim();

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const transaction = await Transaction.findOne({
      userId: req.user.id,
      type: "deposit",
      $or: [
        { "metadata.syriatelTransactionId": paymentId },
        { _id: paymentId },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit transaction not found",
        data: {
          paymentId,
          gatewayStatus: "unknown",
        },
      });
    }

    const gateway = String(transaction.metadata?.get?.("gateway") || "").trim();

    if (gateway === "paymera-egate") {
      const gatewayResponse = await callPaymera({
        method: "GET",
        path: `/api/get-payment-status/${encodeURIComponent(paymentId)}`,
      });

      const gatewayStatusText = getGatewayStatusText(gatewayResponse);

      if (transaction.status === "completed") {
        const user = await User.findById(req.user.id);
        return res.json({
          success: true,
          message: "Deposit already completed",
          data: {
            paymentId,
            gatewayStatus: gatewayStatusText || "completed",
            transactionStatus: transaction.status,
            balance: user?.balance || {},
          },
        });
      }

      if (
        isGatewaySuccess(gatewayStatusText) &&
        transaction.status === "pending"
      ) {
        const user = await User.findById(req.user.id);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const currency = transaction.currency;
        const before = Number(user.balance?.[currency] || 0);
        const amount = Number(transaction.amount || 0);

        user.balance[currency] = before + amount;
        await user.save();

        transaction.status = "completed";
        transaction.balanceBefore = before;
        transaction.balanceAfter = Number(user.balance[currency] || 0);
        transaction.description = "Paymera eGate deposit completed";
        transaction.processedAt = new Date();
        transaction.metadata.set(
          "paymentUrl",
          String(transaction.metadata?.get?.("paymentUrl") || ""),
        );
        await transaction.save();

        await ActivityLog.create({
          userId: req.user.id,
          action: "deposit",
          category: "wallet",
          description: `Deposited ${amount} ${currency} via Paymera eGate`,
          targetId: transaction._id,
          targetModel: "Transaction",
        });

        const io = req.app.get("io");
        if (io) {
          io.to("admin-room").emit("new-transaction", {
            transaction,
            user: req.user,
          });
        }

        await createAndEmitNotification(req, {
          userId: req.user.id,
          type: "wallet",
          titleAr: "إيداع في المحفظة",
          titleEn: "Wallet Deposit Completed",
          messageAr: `تم إيداع ${amount} ${currency} في محفظتك بنجاح.`,
          messageEn: `${amount} ${currency} has been deposited to your wallet successfully.`,
          metadata: {
            transactionId: String(transaction._id),
            amount: String(amount),
            currency,
            method: "mobile-payment",
            balanceAfter: JSON.stringify(user.balance || {}),
            paymentId,
          },
        });

        return res.json({
          success: true,
          message: "Deposit completed",
          data: {
            paymentId,
            gatewayStatus: gatewayStatusText,
            transactionStatus: transaction.status,
            balance: user.balance,
          },
        });
      }

      if (
        isGatewayFailed(gatewayStatusText) &&
        transaction.status === "pending"
      ) {
        transaction.status = gatewayStatusText.includes("cancel")
          ? "cancelled"
          : "failed";
        transaction.description = "Paymera eGate deposit not completed";
        transaction.processedAt = new Date();
        await transaction.save();
      }

      return res.json({
        success: true,
        message: "Deposit status fetched",
        data: {
          paymentId,
          gatewayStatus: gatewayStatusText || "pending",
          transactionStatus: transaction.status,
          isFinal: ["completed", "failed", "cancelled"].includes(
            transaction.status,
          ),
        },
      });
    }

    if (transaction.status === "completed") {
      const user = await User.findById(req.user.id);
      return res.json({
        success: true,
        message: "Deposit already completed",
        data: {
          paymentId,
          gatewayStatus: "completed",
          transactionStatus: transaction.status,
          balance: user?.balance || {},
        },
      });
    }

    return res.json({
      success: true,
      message: "Deposit status fetched",
      data: {
        paymentId,
        gatewayStatus: String(
          transaction.metadata?.get?.("syriatelStatus") || "pending",
        ),
        transactionStatus: transaction.status,
        isFinal: ["completed", "failed", "cancelled"].includes(
          transaction.status,
        ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking deposit status",
      error: error.message,
    });
  }
};

// @desc    Confirm Syriatel Cash deposit using OTP
// @route   POST /api/wallet/deposit/confirm
// @access  Private
exports.confirmDeposit = async (req, res) => {
  try {
    const { transactionId, otp } = req.body || {};
    const normalizedTransactionId = String(transactionId || "").trim();
    const normalizedOtp = String(otp || "").trim();

    if (!normalizedTransactionId || !normalizedOtp) {
      return res.status(400).json({
        success: false,
        message: "transactionId and otp are required",
      });
    }

    const transaction = await Transaction.findOne({
      userId: req.user.id,
      type: "deposit",
      status: "pending",
      $or: [
        { "metadata.syriatelTransactionId": normalizedTransactionId },
        { _id: normalizedTransactionId },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit transaction not found",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = await getSyriatelToken();
    const gatewayResponse = await callSyriatel({
      path: SYRIATEL_PAYMENT_CONFIRMATION_PATH,
      body: {
        ...getSyriatelMerchantPayload(token),
        OTP: normalizedOtp,
        transactionID: normalizedTransactionId,
      },
    });

    const { errorCode, errorDesc } = getSyriatelErrorInfo(gatewayResponse);
    if (errorCode !== "0") {
      transaction.metadata.set("syriatelStatus", "confirmation-failed");
      transaction.metadata.set("syriatelLastErrorCode", errorCode || "");
      transaction.metadata.set(
        "syriatelLastError",
        errorDesc || "OTP confirmation failed",
      );

      if (isSyriatelFinalConfirmationError(errorCode)) {
        transaction.status = "failed";
        transaction.description = "Syriatel Cash deposit failed";
        transaction.processedAt = new Date();
      }

      await transaction.save();

      return res.status(400).json({
        success: false,
        message: errorDesc || "OTP confirmation failed",
        data: {
          transactionId: normalizedTransactionId,
          errorCode,
          errorDesc,
          transactionStatus: transaction.status,
        },
      });
    }

    const currency = transaction.currency;
    const before = Number(user.balance?.[currency] || 0);
    const amount = Number(transaction.amount || 0);

    user.balance[currency] = before + amount;
    await user.save();

    transaction.status = "completed";
    transaction.balanceBefore = before;
    transaction.balanceAfter = Number(user.balance[currency] || 0);
    transaction.description = "Syriatel Cash deposit completed";
    transaction.processedAt = new Date();
    transaction.metadata.set("syriatelStatus", "completed");
    transaction.metadata.set("syriatelLastError", "");
    await transaction.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "deposit",
      category: "wallet",
      description: `Deposited ${amount} ${currency} via Syriatel Cash`,
      targetId: transaction._id,
      targetModel: "Transaction",
    });

    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("new-transaction", {
        transaction,
        user: req.user,
      });
    }

    await createAndEmitNotification(req, {
      userId: req.user.id,
      type: "wallet",
      titleAr: "إيداع في المحفظة",
      titleEn: "Wallet Deposit Completed",
      messageAr: `تم إيداع ${amount} ${currency} في محفظتك بنجاح.`,
      messageEn: `${amount} ${currency} has been deposited to your wallet successfully.`,
      metadata: {
        transactionId: String(transaction._id),
        amount: String(amount),
        currency,
        method: "mobile-payment",
        balanceAfter: JSON.stringify(user.balance || {}),
        paymentId: normalizedTransactionId,
      },
    });

    return res.json({
      success: true,
      message: "Deposit completed",
      data: {
        transactionId: normalizedTransactionId,
        transactionStatus: transaction.status,
        balance: user.balance,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error confirming deposit",
      error: error.message,
    });
  }
};

// @desc    Resend Syriatel Cash OTP
// @route   POST /api/wallet/deposit/resend-otp
// @access  Private
exports.resendDepositOtp = async (req, res) => {
  try {
    const { transactionId } = req.body || {};
    const normalizedTransactionId = String(transactionId || "").trim();

    if (!normalizedTransactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    const transaction = await Transaction.findOne({
      userId: req.user.id,
      type: "deposit",
      status: "pending",
      $or: [
        { "metadata.syriatelTransactionId": normalizedTransactionId },
        { _id: normalizedTransactionId },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit transaction not found",
      });
    }

    const token = await getSyriatelToken();
    const gatewayResponse = await callSyriatel({
      path: SYRIATEL_RESEND_OTP_PATH,
      body: {
        ...getSyriatelMerchantPayload(token),
        transactionID: normalizedTransactionId,
      },
    });

    const { errorCode, errorDesc } = getSyriatelErrorInfo(gatewayResponse);
    if (errorCode !== "0") {
      transaction.metadata.set("syriatelStatus", "otp-resend-failed");
      transaction.metadata.set("syriatelLastErrorCode", errorCode || "");
      transaction.metadata.set(
        "syriatelLastError",
        errorDesc || "Failed to resend OTP",
      );
      await transaction.save();

      return res.status(400).json({
        success: false,
        message: errorDesc || "Failed to resend OTP",
        data: {
          transactionId: normalizedTransactionId,
          errorCode,
          errorDesc,
        },
      });
    }

    transaction.metadata.set("syriatelStatus", "otp-resent");
    transaction.metadata.set("syriatelLastError", "");
    await transaction.save();

    return res.json({
      success: true,
      message: "OTP resent",
      data: {
        transactionId: normalizedTransactionId,
        transactionStatus: transaction.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resending OTP",
      error: error.message,
    });
  }
};

// @desc    Cancel deposit payment
// @route   POST /api/wallet/deposit/cancel/:paymentId
// @access  Private
exports.cancelDeposit = async (req, res) => {
  try {
    const paymentId = String(req.params.paymentId || "").trim();

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const transaction = await Transaction.findOne({
      userId: req.user.id,
      type: "deposit",
      $or: [
        { "metadata.syriatelTransactionId": paymentId },
        { _id: paymentId },
      ],
      status: "pending",
    });

    if (transaction) {
      const gateway = String(
        transaction.metadata?.get?.("gateway") || "",
      ).trim();

      if (gateway === "paymera-egate") {
        const gatewayResponse = await callPaymera({
          method: "POST",
          path: "/api/cancel-payment",
          body: {
            lang: PAYMERA_DEFAULT_LANG,
            payment_id: paymentId,
          },
        });

        transaction.status = "cancelled";
        transaction.description = "Paymera eGate deposit cancelled";
        transaction.processedAt = new Date();
        await transaction.save();

        return res.json({
          success: true,
          message: "Deposit cancelled",
          data: {
            paymentId,
            gatewayResponse,
          },
        });
      }

      transaction.status = "cancelled";
      transaction.description = "Syriatel Cash deposit cancelled";
      transaction.processedAt = new Date();
      transaction.metadata.set("syriatelStatus", "cancelled");
      await transaction.save();
    }

    return res.json({
      success: true,
      message: "Deposit cancelled",
      data: {
        paymentId,
        gatewayResponse: { cancelled: true },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling deposit",
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
