const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const { createAndEmitNotification } = require("./notificationController");
const ExcelJS = require("exceljs");

const PAYMERA_BASE_URL =
  process.env.PAYMERA_EGATE_BASE_URL || "https://egate-t.paymera.cc";
const PAYMERA_FALLBACK_BASE_URL = "https://egate-t.paymera.cc";
const PAYMERA_USERNAME = process.env.PAYMERA_EGATE_USERNAME || "";
const PAYMERA_PASSWORD = process.env.PAYMERA_EGATE_PASSWORD || "";
const PAYMERA_TERMINAL_ID = process.env.PAYMERA_EGATE_TERMINAL_ID || "";
const PAYMERA_DEFAULT_LANG = process.env.PAYMERA_EGATE_LANG || "en";
const PAYMERA_PAYMENT_TYPE = process.env.PAYMERA_EGATE_PAYMENT_TYPE || "";
const PAYMERA_CALLBACK_URL = process.env.PAYMERA_EGATE_CALLBACK_URL || "";
const PAYMERA_TRIGGER_URL = process.env.PAYMERA_EGATE_TRIGGER_URL || "";
const PAYMERA_SUCCESS_REDIRECT_URL =
  process.env.PAYMERA_EGATE_SUCCESS_REDIRECT_URL ||
  "http://localhost:5173/?deposit=success";

const getActiveServerPort = () =>
  String(process.env.ACTIVE_SERVER_PORT || process.env.PORT || "").trim();

const normalizeLocalhostUrl = (url) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl || !rawUrl.includes("localhost")) return rawUrl;

  const activePort = getActiveServerPort();
  if (!activePort) return rawUrl;

  return rawUrl.replace(/localhost:\\d+/i, `localhost:${activePort}`);
};

const getPaymeraCallbackUrl = () => normalizeLocalhostUrl(PAYMERA_CALLBACK_URL);
const getPaymeraTriggerUrl = () => normalizeLocalhostUrl(PAYMERA_TRIGGER_URL);
const getPaymeraCallbackUrlWithPaymentId = (paymentId) => {
  const baseUrl = getPaymeraCallbackUrl();
  if (!baseUrl) return "";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}paymentId=${encodeURIComponent(String(paymentId))}`;
};

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
  "A",
  "a",
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

const urlKeyPatterns = [
  /payment[_-]?url/i,
  /redirect[_-]?url/i,
  /location$/i,
  /url$/i,
  /payment[_-]?link/i,
  /redirect[_-]?link/i,
  /link$/i,
];

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const encodeFormValue = (key, value, entries) => {
  if (value === undefined || value === null) return;

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      value.forEach((item) => encodeFormValue(`${key}[]`, item, entries));
      return;
    }

    Object.entries(value).forEach(([subKey, subValue]) => {
      encodeFormValue(`${key}[${subKey}]`, subValue, entries);
    });
    return;
  }

  entries.push([key, String(value)]);
};

const toUrlEncodedForm = (body) => {
  if (!body || typeof body !== "object") return "";

  const entries = [];
  Object.entries(body).forEach(([key, value]) => encodeFormValue(key, value, entries));
  return new URLSearchParams(entries).toString();
};

const isPaymeraFailureResponse = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  const errorCode = String(payload?.ErrorCode ?? payload?.errorCode ?? "").trim();
  const message = String(payload?.ErrorMessage ?? payload?.message ?? "").toLowerCase();
  return (
    (errorCode && errorCode !== "0") ||
    message.includes("some info are missing") ||
    message.includes("array_key_exists")
  );
};

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

const extractIdFromQueryString = (text) => {
  const str = String(text || "");
  const queryPattern = /[?&]([^=&#]+)=([^&#]*)/g;
  let match;

  while ((match = queryPattern.exec(str))) {
    const key = String(match[1] || "").trim();
    const value = String(match[2] || "").trim();
    if (!key || !value) continue;

    if (/payment[_-]?id|transaction[_-]?id|id$/i.test(key)) {
      return decodeURIComponent(value);
    }
  }

  return "";
};

const extractIdFromUrl = (text) => {
  const str = String(text || "").trim();
  if (!str) return "";

  const queryId = extractIdFromQueryString(str);
  if (queryId) return queryId;

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
    for (const segment of segments.reverse()) {
      const inferred = extractUuidLike(segment) || String(segment).trim();
      if (inferred && inferred.length >= 4 && !/^(api|create|payment|callback|success|failed|error)$/i.test(inferred)) {
        return inferred;
      }
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

  if (Object.prototype.hasOwnProperty.call(cloned, "terminal_id")) {
    cloned.terminal_id = String(cloned.terminal_id || "");
  }

  if (Object.prototype.hasOwnProperty.call(cloned, "amount")) {
    cloned.amount = String(cloned.amount || "");
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

const sendPaymeraRedirect = (res, url, message) => {
  const safeUrl = String(url || "").replace(/"/g, '%22');
  res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>${message || "Redirecting..."}</p>
    <script>window.location.href = ${JSON.stringify(safeUrl)};</script>
  </body>
</html>`);
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
    payload?.Data?.status ||
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
  if (payload && typeof payload === "object") {
    const explicitUrl = String(
      payload.redirectUrl ||
        payload.location ||
        payload?.headers?.location ||
        payload?.response?.headers?.location ||
        "",
    ).trim();

    if (explicitUrl) {
      const inferred = extractIdFromUrl(explicitUrl);
      if (inferred) return inferred;
    }
  }

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

const extractFirstUrlFromString = (text) => {
  const str = String(text || "");
  const match = str.match(/https?:\/\/[\w\-./?&=#+%]+/gi);
  return match?.[0] || "";
};

const getGatewayPaymentUrl = (payload) => {
  if (payload && typeof payload === "object") {
    const explicitUrl = String(
      payload.redirectUrl ||
        payload.location ||
        payload?.headers?.location ||
        payload?.response?.headers?.location ||
        "",
    ).trim();

    if (explicitUrl) {
      return explicitUrl;
    }
  }

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

  const rawText =
    typeof payload === "string"
      ? payload
      : typeof payload?.raw === "string"
      ? payload.raw
      : JSON.stringify(payload || {});

  return extractFirstUrlFromString(rawText);
};

const callPaymera = async ({ method, path, body, baseOverride, contentType }) => {
  if (!PAYMERA_USERNAME || !PAYMERA_PASSWORD || !PAYMERA_TERMINAL_ID) {
    throw new Error("Paymera eGate credentials are not configured");
  }

  const base = (baseOverride || PAYMERA_BASE_URL).replace(/\/$/, "");
  const authToken = Buffer.from(
    `${PAYMERA_USERNAME}:${PAYMERA_PASSWORD}`,
  ).toString("base64");

  logPaymera("REQUEST", {
    method,
    url: `${base}${path}`,
    body: sanitizePaymeraPayload(body),
  });

  const requestBody =
    body && typeof body === "object"
      ? contentType === "application/x-www-form-urlencoded"
        ? toUrlEncodedForm(body)
        : JSON.stringify(body)
      : typeof body === "string"
      ? body
      : undefined;
  const requestContentType = body
    ? contentType || "application/json"
    : undefined;

  const headers = {
    Authorization: `Basic ${authToken}`,
    Accept: "application/json",
  };
  if (requestContentType) {
    headers["Content-Type"] = requestContentType;
  }

  const response = await fetch(`${base}${path}`, {
    method,
    redirect: "manual",
    headers,
    body: requestBody,
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  const locationHeader = response.headers.get("location") || "";
  const isErrorRedirect =
    response.status >= 300 &&
    response.status < 400 &&
    /\/api\/Error/i.test(locationHeader);

  const isFailurePayload =
    response.status === 200 &&
    data &&
    typeof data === "object" &&
    ((typeof data.ErrorCode !== "undefined" && Number(data.ErrorCode) !== 0) ||
      (typeof data.errorCode !== "undefined" &&
        String(data.errorCode).trim() !== "0") ||
      (typeof data.status === "string" &&
        isGatewayFailed(String(data.status).trim())));

  const responseDetails = {
    method,
    url: `${base}${path}`,
    status: response.status,
    ok: response.ok,
    location: locationHeader,
    raw: text,
    parsed: data,
  };

  logPaymera("RESPONSE", responseDetails);

  if ((isErrorRedirect || isFailurePayload) && base !== PAYMERA_FALLBACK_BASE_URL) {
    logPaymera("WARNING", {
      message: "Paymera returned error response; retrying fallback base URL",
      attemptBase: base,
      location: locationHeader,
      failurePayload: isFailurePayload ? data : undefined,
    });
    return callPaymera({ method, path, body, baseOverride: PAYMERA_FALLBACK_BASE_URL });
  }

  if (response.status >= 300 && response.status < 400 && locationHeader) {
    if (/\/api\/Error/i.test(locationHeader)) {
      const errorMessage = `Paymera redirect error path returned: ${locationHeader}`;
      logPaymera("ERROR", {
        method,
        url: `${base}${path}`,
        status: response.status,
        location: locationHeader,
      });
      throw new Error(errorMessage);
    }

    const absoluteRedirect = /^https?:\/\//i.test(locationHeader)
      ? locationHeader
      : `${base}${locationHeader}`;

    return {
      status: response.status,
      location: locationHeader,
      redirectUrl: absoluteRedirect,
      headers: Object.fromEntries(response.headers.entries()),
      raw: text,
    };
  }

  if (!response.ok) {
    logPaymera("ERROR", {
      method,
      url: `${base}${path}`,
      status: response.status,
      parsed: data,
      location: locationHeader,
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
      let gatewayResponse;
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
          externalPaymentId: "",
          paymentUrl: "",
        },
        processedAt: null,
      });

      try {
        const callbackUrl = getPaymeraCallbackUrlWithPaymentId(transaction._id);
        const triggerUrl = getPaymeraTriggerUrl();

        if (!callbackUrl || !triggerUrl) {
        return res.status(500).json({
          success: false,
          message:
            "Paymera callback or trigger URL is not configured. Please set PAYMERA_EGATE_CALLBACK_URL and PAYMERA_EGATE_TRIGGER_URL in backend/.env.",
        });
      }

      const paymeraPayload = {
          lang: PAYMERA_DEFAULT_LANG,
          terminalId: String(PAYMERA_TERMINAL_ID || ""),
          amount: parsedAmount,
          currency: normalizedCurrency,
          callbackURL: callbackUrl,
          triggerURL: triggerUrl,
          savedCards: "S",
          appUser: "Shipme",
          notes: `Wallet deposit for user ${req.user.id} (${normalizedCurrency})`,
        };

        if (PAYMERA_PAYMENT_TYPE) {
          paymeraPayload.payment_type = PAYMERA_PAYMENT_TYPE;
        }

        gatewayResponse = await callPaymera({
          method: "POST",
          path: "/api/create-payment",
          body: paymeraPayload,
          contentType: "application/x-www-form-urlencoded",
        });

        if (isPaymeraFailureResponse(gatewayResponse)) {
          logPaymera("WARNING", {
            message: "Paymera returned a failure response; retrying nested data wrapper",
            originalResponse: gatewayResponse,
          });

          gatewayResponse = await callPaymera({
            method: "POST",
            path: "/api/create-payment",
            body: {
              data: paymeraPayload,
            },
            contentType: "application/x-www-form-urlencoded",
          });
        }
      } catch (paymeraErr) {
        transaction.status = "failed";
        transaction.description = "Paymera eGate create payment failed";
        transaction.processedAt = new Date();
        transaction.metadata = transaction.metadata || {};
        if (typeof transaction.metadata.set === "function") {
          transaction.metadata.set("paymeraError", String(paymeraErr?.message || paymeraErr));
        } else {
          transaction.metadata.paymeraError = String(paymeraErr?.message || paymeraErr);
        }
        await transaction.save();

        console.error("Paymera create-payment error:", paymeraErr);
        return res.status(502).json({
          success: false,
          message: "Paymera request failed",
          error: String(paymeraErr?.message || paymeraErr),
        });
      }

      const externalPaymentId =
        String(
          gatewayResponse?.Data?.paymentId ||
            gatewayResponse?.Data?.payment_id ||
            gatewayResponse?.Data?.id ||
            "",
        ).trim();
      const paymeraRrn = String(
        gatewayResponse?.Data?.rrn ||
          gatewayResponse?.Data?.RRN ||
          gatewayResponse?.Data?.rrnNumber ||
          gatewayResponse?.Data?.reference ||
          "",
      ).trim();
      const paymentUrl = getGatewayPaymentUrl(gatewayResponse);

      if (!externalPaymentId) {
        transaction.status = "failed";
        transaction.description = "Paymera eGate create payment returned no external ID";
        transaction.processedAt = new Date();
        transaction.metadata = transaction.metadata || {};
        if (typeof transaction.metadata.set === "function") {
          transaction.metadata.set("paymeraResponse", gatewayResponse);
        } else {
          transaction.metadata.paymeraResponse = gatewayResponse;
        }
        await transaction.save();

        console.error("Paymera create returned no paymentId", { gatewayResponse });
        return res.status(502).json({
          success: false,
          message: "Unable to retrieve payment ID from gateway",
          data: { gatewayResponse },
        });
      }

      transaction.metadata = transaction.metadata || {};
      if (typeof transaction.metadata.set === "function") {
        transaction.metadata.set("externalPaymentId", externalPaymentId);
        transaction.metadata.set("paymentUrl", paymentUrl);
        if (paymeraRrn) {
          transaction.metadata.set("paymeraRrn", paymeraRrn);
        }
      } else {
        transaction.metadata.externalPaymentId = externalPaymentId;
        transaction.metadata.paymentUrl = paymentUrl;
        if (paymeraRrn) {
          transaction.metadata.paymeraRrn = paymeraRrn;
        }
      }
      if (paymeraRrn) {
        transaction.description = `Paymera eGate deposit pending | Transaction Id: ${paymeraRrn}`;
      }
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

// @desc    Paymera callback / webhook handler
// @route   POST|GET /api/wallet/paymera/callback
// @access  Public (called by Paymera)
exports.paymeraCallback = async (req, res) => {
  try {
    const incoming = { query: req.query || {}, body: req.body || {} };

    logPaymera("CALLBACK_RECEIVED", sanitizePaymeraPayload(incoming));

    // Try to get our internal transaction ID from the callback query or payload
    const paymentId =
      String(req.query.paymentId || "").trim() ||
      getGatewayPaymentId(incoming) ||
      getGatewayPaymentId(req.query) ||
      getGatewayPaymentId(req.body) ||
      "";

    if (!paymentId) {
      logPaymera("CALLBACK_WARN", { message: "No paymentId found in callback", incoming });
      return res.redirect(PAYMERA_SUCCESS_REDIRECT_URL);
    }

    // find the transaction by internal id or external gateway id
    const transaction = await Transaction.findOne({
      $or: [
        { _id: paymentId },
        { "metadata.externalPaymentId": paymentId },
      ],
    });

    if (!transaction) {
      logPaymera("CALLBACK_WARN", { message: "Transaction not found for paymentId", paymentId });
      return res.status(404).send("Transaction not found");
    }

    const callbackGatewayPaymentId = String(
      getGatewayPaymentId(req.body) || getGatewayPaymentId(req.query) || ""
    ).trim();
    const savedExternalPaymentId = String(
      transaction.metadata?.get("externalPaymentId") || ""
    ).trim();

    let gatewayPaymentId = savedExternalPaymentId || "";
    if (!gatewayPaymentId && callbackGatewayPaymentId && callbackGatewayPaymentId !== String(transaction._id)) {
      transaction.metadata = transaction.metadata || {};
      if (typeof transaction.metadata.set === "function") {
        transaction.metadata.set("externalPaymentId", callbackGatewayPaymentId);
      } else {
        transaction.metadata.externalPaymentId = callbackGatewayPaymentId;
      }
      await transaction.save();
      gatewayPaymentId = callbackGatewayPaymentId;
      logPaymera("CALLBACK_INFO", {
        message: "Stored external Paymera payment id from callback",
        transactionId: transaction._id,
        externalPaymentId: gatewayPaymentId,
      });
    }

    if (!gatewayPaymentId) {
      logPaymera("CALLBACK_WARN", {
        message: "No external Paymera payment ID stored for transaction",
        transactionId: transaction._id,
        transaction: transaction.toObject(),  
        exter: transaction.metadata?.externalPaymentId

      });
      return res.status(500).send("Missing gateway payment id");
    }

    // Query Paymera for latest status
    let gatewayResponse;
    try {
      gatewayResponse = await callPaymera({
        method: "GET",
        path: `/api/get-payment-status/${encodeURIComponent(gatewayPaymentId)}`,
      });
    } catch (err) {
      logPaymera("CALLBACK_ERROR", { message: "Failed to query Paymera status", error: String(err?.message || err) });
      return res.status(502).send("Failed to query gateway");
    }

    const gatewayStatusText = getGatewayStatusText(gatewayResponse);

    const errorMessage =
      String(
        gatewayResponse?.ErrorMessage ||
          gatewayResponse?.errorMessage ||
          gatewayResponse?.message ||
          gatewayResponse?.status ||
          gatewayResponse?.data?.ErrorMessage ||
          gatewayResponse?.data?.errorMessage ||
          gatewayResponse?.data?.message ||
          "Payment failed",
      ).trim();

    if (isGatewaySuccess(gatewayStatusText)) {
      if (transaction.status === "pending") {
        const user = await User.findById(transaction.userId);
        if (user) {
          const currency = transaction.currency;
          const before = Number(user.balance?.[currency] || 0);
          const amount = Number(transaction.amount || 0);
          user.balance[currency] = before + amount;
          await user.save();
        }

        const paymeraRrn = String(
          transaction.metadata?.get?.("paymeraRrn") ||
            transaction.metadata?.paymeraRrn ||
            gatewayResponse?.Data?.rrn ||
            gatewayResponse?.Data?.RRN ||
            gatewayResponse?.Data?.rrnNumber ||
            gatewayResponse?.Data?.reference ||
            "",
        ).trim();

        transaction.status = "completed";
        transaction.description = paymeraRrn
          ? `Paymera eGate deposit completed | Transaction Id: ${paymeraRrn}`
          : `Paymera eGate deposit completed`;
        transaction.metadata = transaction.metadata || {};
        if (typeof transaction.metadata.set === "function") {
          transaction.metadata.set("paymeraStatus", gatewayStatusText);
          if (paymeraRrn) {
            transaction.metadata.set("paymeraRrn", paymeraRrn);
          }
        } else {
          transaction.metadata.paymeraStatus = gatewayStatusText;
          if (paymeraRrn) {
            transaction.metadata.paymeraRrn = paymeraRrn;
          }
        }
        transaction.processedAt = new Date();
        await transaction.save();
      }

      logPaymera("CALLBACK_INFO", {
        message: "Paymera deposit completed",
        paymentId,
        gatewayStatusText,
        transactionStatus: transaction.status,
      });

      return res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Payment Successful</title>
    <meta http-equiv="refresh" content="3;url=${PAYMERA_SUCCESS_REDIRECT_URL}" />
    <style>
      body { font-family: sans-serif; background: #f5f7fb; color: #1f2937; margin:0; padding:0; }
      .page { max-width: 600px; margin: 64px auto; text-align: center; padding: 24px; }
      .loader { margin: 24px auto 16px; width: 64px; height: 64px; border: 8px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      a { color: #4f46e5; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="loader" aria-hidden="true"></div>
      <h1>Payment Successful</h1>
      <h2>تمت عملية الدفع بنجاح</h2>
      <p>Your deposit has been confirmed and your balance has been updated.</p>
      <p>تم تأكيد الإيداع وتم تحديث رصيدك.</p>
      <p><strong>Transaction ID:</strong> ${transaction._id}</p>
      <p><strong>رقم المعاملة:</strong> ${transaction._id}</p>
      <p><strong>Notes:</strong> Paymera eGate deposit completed.</p>
      <p><strong>الملاحظات:</strong> تم إكمال الإيداع عبر Paymera eGate.</p>
      <p>Redirecting to home in 3 seconds...</p>
      <p>جاري التحويل إلى الصفحة الرئيسية خلال ٣ ثوانٍ...</p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">Click here if you are not redirected</a></p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">انقر هنا إذا لم يتم إعادة التوجيه</a></p>
    </div>
    <script>
      setTimeout(() => {
        window.location.href = ${JSON.stringify(PAYMERA_SUCCESS_REDIRECT_URL)};
      }, 3000);
    </script>
  </body>
</html>`);
    }

    if (gatewayStatusText && isGatewayFailed(gatewayStatusText)) {
      transaction.status = "failed";
      transaction.description = `Paymera eGate deposit failed: ${errorMessage}`;
      transaction.metadata = transaction.metadata || {};
      if (typeof transaction.metadata.set === "function") {
        transaction.metadata.set("paymeraStatus", gatewayStatusText);
        transaction.metadata.set("paymeraError", errorMessage);
      } else {
        transaction.metadata.paymeraStatus = gatewayStatusText;
        transaction.metadata.paymeraError = errorMessage;
      }
      transaction.processedAt = new Date();
      await transaction.save();

      logPaymera("CALLBACK_INFO", {
        message: "Paymera deposit failed",
        paymentId,
        gatewayStatusText,
        transactionStatus: transaction.status,
      });

      return res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Payment Failed</title>
    <style>
      body { font-family: sans-serif; background: #f5f7fb; color: #1f2937; margin:0; padding:0; }
      .page { max-width: 600px; margin: 64px auto; text-align: center; padding: 24px; }
      a { color: #ef4444; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Payment Failed</h1>
      <h2>فشل الدفع</h2>
      <p>${errorMessage}</p>
      <p>There was an issue processing your payment. Please try again or contact support.</p>
      <p>حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.</p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">Return to home</a></p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">العودة إلى الصفحة الرئيسية</a></p>
    </div>
  </body>
</html>`);
    }

    logPaymera("CALLBACK_INFO", {
      message: "Paymera callback received, status not final",
      paymentId,
      gatewayStatusText,
      transactionStatus: transaction.status,
    });
    return res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Payment Pending</title>
    <style>
      body { font-family: sans-serif; background: #f5f7fb; color: #1f2937; margin:0; padding:0; }
      .page { max-width: 600px; margin: 64px auto; text-align: center; padding: 24px; }
      a { color: #4f46e5; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Payment Pending</h1>
      <h2>الدفع قيد المعالجة</h2>
      <p>Your payment is still processing. Please refresh this page or return later.</p>
      <p>لا يزال الدفع قيد المعالجة. يرجى تحديث الصفحة أو العودة لاحقًا.</p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">Return to home</a></p>
      <p><a href="${PAYMERA_SUCCESS_REDIRECT_URL}">العودة إلى الصفحة الرئيسية</a></p>
    </div>
  </body>
</html>`);
  } catch (error) {
    console.error("Paymera callback error:", error);
    return res.status(500).send("Callback handler error");
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
        { "metadata.externalPaymentId": paymentId },
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
      const gatewayPaymentId =
        String(transaction.metadata?.get?.("externalPaymentId") || "") ||
        paymentId;

      let gatewayResponse;
      try {
        gatewayResponse = await callPaymera({
          method: "GET",
          path: `/api/get-payment-status/${encodeURIComponent(
            gatewayPaymentId,
          )}`,
        });
      } catch (paymeraErr) {
        console.error("Paymera status check error:", paymeraErr);
        return res.status(502).json({
          success: false,
          message: "Paymera request failed",
          error: String(paymeraErr?.message || paymeraErr),
          data: { paymentId, transactionId: transaction._id },
        });
      }

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
