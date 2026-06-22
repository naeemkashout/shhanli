"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditRequests;
var react_1 = require("react");
var card_1 = require("@/components/ui/card");
var api_1 = require("@/services/api");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var dialog_1 = require("@/components/ui/dialog");
var table_1 = require("@/components/ui/table");
var badge_1 = require("@/components/ui/badge");
var lucide_react_1 = require("lucide-react");
var sonner_1 = require("sonner");
var adminService_1 = require("@/services/adminService");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var AuthContext_1 = require("@/contexts/AuthContext");
var socket_io_client_1 = require("socket.io-client");
var statusOptions = ["all", "pending", "approved", "rejected"];
function EditRequests() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
    var _12 = (0, LanguageContext_1.useLanguage)(), language = _12.language, t = _12.t;
    var tr = function (ar, en) { return (language === "ar" ? ar : en); };
    var user = (0, AuthContext_1.useAuth)().user;
    var _13 = (0, react_1.useState)([]), requests = _13[0], setRequests = _13[1];
    var _14 = (0, react_1.useState)(true), isLoading = _14[0], setIsLoading = _14[1];
    var _15 = (0, react_1.useState)(""), search = _15[0], setSearch = _15[1];
    var _16 = (0, react_1.useState)("pending"), statusFilter = _16[0], setStatusFilter = _16[1];
    var _17 = (0, react_1.useState)(""), companyId = _17[0], setCompanyId = _17[1];
    var _18 = (0, react_1.useState)([]), companies = _18[0], setCompanies = _18[1];
    var _19 = (0, react_1.useState)(1), page = _19[0], setPage = _19[1];
    var _20 = (0, react_1.useState)(1), totalPages = _20[0], setTotalPages = _20[1];
    var _21 = (0, react_1.useState)(null), selectedRequest = _21[0], setSelectedRequest = _21[1];
    var _22 = (0, react_1.useState)(null), selectedText = _22[0], setSelectedText = _22[1];
    var _23 = (0, react_1.useState)({
        shippingMode: "",
        senderName: "",
        senderPhone: "",
        senderEmail: "",
        senderCity: "",
        senderState: "",
        senderCountry: "",
        senderStreet: "",
        receiverName: "",
        receiverPhone: "",
        receiverEmail: "",
        receiverCity: "",
        receiverState: "",
        receiverCountry: "",
        receiverStreet: "",
        packageType: "",
        packageDescription: "",
        packageWeight: "",
        packageLength: "",
        packageWidth: "",
        packageHeight: "",
        packageValue: "",
        packageCurrency: "",
        packageFragile: "",
        packagePackagingRequested: "",
    }), reviewUpdatesForm = _23[0], setReviewUpdatesForm = _23[1];
    (0, react_1.useEffect)(function () {
        fetchRequests();
    }, [search, statusFilter, companyId, page]);
    (0, react_1.useEffect)(function () {
        var loadCompanies = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, adminService_1.default.getAllCompanies({ page: 1, limit: 1000 })];
                    case 1:
                        response = _b.sent();
                        setCompanies(response.data || []);
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        setCompanies([]);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        loadCompanies();
    }, []);
    (0, react_1.useEffect)(function () {
        var _a;
        var role = String((user === null || user === void 0 ? void 0 : user.role) || "").trim();
        var isPlatformAdmin = role === "admin" || role === "super-admin";
        var companyId = String((typeof (user === null || user === void 0 ? void 0 : user.shippingCompanyId) === "string"
            ? user === null || user === void 0 ? void 0 : user.shippingCompanyId
            : (_a = user === null || user === void 0 ? void 0 : user.shippingCompanyId) === null || _a === void 0 ? void 0 : _a._id) || "").trim();
        if (!isPlatformAdmin && role !== "company-admin")
            return;
        if (role === "company-admin" && !companyId)
            return;
        var apiBaseUrl = (0, api_1.normalizeLocalApiUrl)(import.meta.env.VITE_API_URL || "http://localhost:5001/api");
        var socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");
        var socket = (0, socket_io_client_1.io)(socketUrl, {
            transports: ["websocket", "polling"],
            withCredentials: true,
        });
        socket.on("connect", function () {
            if (isPlatformAdmin) {
                socket.emit("join-admin");
            }
            else {
                socket.emit("join-company-room", companyId);
            }
        });
        socket.on("edit-request-created", function (payload) {
            sonner_1.toast.info(tr("\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628 \u062A\u0639\u062F\u064A\u0644 \u062C\u062F\u064A\u062F \u0644\u0644\u0634\u062D\u0646\u0629 ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || ""), "New edit request received for shipment ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || "")));
            fetchRequests();
        });
        socket.on("edit-request-reviewed", function (payload) {
            sonner_1.toast.info((payload === null || payload === void 0 ? void 0 : payload.action) === "approve"
                ? tr("\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0637\u0644\u0628 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0634\u062D\u0646\u0629 ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || ""), "Edit request approved for shipment ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || ""))
                : tr("\u062A\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0634\u062D\u0646\u0629 ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || ""), "Edit request rejected for shipment ".concat((payload === null || payload === void 0 ? void 0 : payload.trackingNumber) || "")));
            fetchRequests();
        });
        return function () {
            socket.disconnect();
        };
    }, [
        user === null || user === void 0 ? void 0 : user.role,
        user === null || user === void 0 ? void 0 : user.shippingCompanyId,
        language,
        search,
        statusFilter,
        page,
    ]);
    var fetchRequests = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, 3, 4]);
                    setIsLoading(true);
                    return [4 /*yield*/, adminService_1.default.getEditRequests({
                            search: search,
                            status: statusFilter,
                            companyId: companyId,
                            page: page,
                            limit: 10,
                        })];
                case 1:
                    response = _b.sent();
                    setRequests(response.data || []);
                    setTotalPages(((_a = response.pagination) === null || _a === void 0 ? void 0 : _a.pages) || 1);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _b.sent();
                    sonner_1.toast.error(error_1.message ||
                        tr("فشل تحميل طلبات التعديل", "Failed to load edit requests"));
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var openReviewDialog = function (shipment) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
        setSelectedRequest(shipment);
        setReviewUpdatesForm({
            shippingMode: String((shipment === null || shipment === void 0 ? void 0 : shipment.shippingMode) || "standard"),
            senderName: String(((_a = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _a === void 0 ? void 0 : _a.name) || ""),
            senderPhone: String(((_b = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _b === void 0 ? void 0 : _b.phone) || ""),
            senderEmail: String(((_c = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _c === void 0 ? void 0 : _c.email) || ""),
            senderCity: String(((_d = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _d === void 0 ? void 0 : _d.city) || ""),
            senderState: String(((_e = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _e === void 0 ? void 0 : _e.state) || ""),
            senderCountry: String(((_f = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _f === void 0 ? void 0 : _f.country) || ""),
            senderStreet: String(((_g = shipment === null || shipment === void 0 ? void 0 : shipment.sender) === null || _g === void 0 ? void 0 : _g.street) || ""),
            receiverName: String(((_j = (_h = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.name) || ""),
            receiverPhone: String(((_l = (_k = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.phone) || ""),
            receiverEmail: String(((_o = (_m = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.email) || ""),
            receiverCity: String(((_q = (_p = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.city) || ""),
            receiverState: String(((_s = (_r = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _r === void 0 ? void 0 : _r[0]) === null || _s === void 0 ? void 0 : _s.state) || ""),
            receiverCountry: String(((_u = (_t = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _t === void 0 ? void 0 : _t[0]) === null || _u === void 0 ? void 0 : _u.country) || ""),
            receiverStreet: String(((_w = (_v = shipment === null || shipment === void 0 ? void 0 : shipment.receivers) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.street) || ""),
            packageType: String(((_x = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _x === void 0 ? void 0 : _x.type) || ""),
            packageDescription: String(((_y = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _y === void 0 ? void 0 : _y.description) || ""),
            packageWeight: String((_0 = (_z = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _z === void 0 ? void 0 : _z.weight) !== null && _0 !== void 0 ? _0 : ""),
            packageLength: String((_2 = (_1 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _1 === void 0 ? void 0 : _1.length) !== null && _2 !== void 0 ? _2 : ""),
            packageWidth: String((_4 = (_3 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _3 === void 0 ? void 0 : _3.width) !== null && _4 !== void 0 ? _4 : ""),
            packageHeight: String((_6 = (_5 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _5 === void 0 ? void 0 : _5.height) !== null && _6 !== void 0 ? _6 : ""),
            packageValue: String((_8 = (_7 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _7 === void 0 ? void 0 : _7.value) !== null && _8 !== void 0 ? _8 : ""),
            packageCurrency: String(((_9 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _9 === void 0 ? void 0 : _9.currency) || ""),
            packageFragile: String(((_10 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _10 === void 0 ? void 0 : _10.fragile) ? "true" : "false"),
            packagePackagingRequested: String(((_11 = shipment === null || shipment === void 0 ? void 0 : shipment.package) === null || _11 === void 0 ? void 0 : _11.packagingRequested) ? "true" : "false"),
        });
    };
    var submitReview = function (action) { return __awaiter(_this, void 0, void 0, function () {
        var shipmentUpdates, parseOptionalNumber, weightValue, packageValue, keepOrTrim, baseSender, baseReceiver, basePackage, sender, receiver, pkg, updates, response, updatedCount, error_2;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (!(selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest._id))
                        return [2 /*return*/];
                    if (((_a = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.editRequest) === null || _a === void 0 ? void 0 : _a.status) !== "pending") {
                        sonner_1.toast.error(tr("تمت مراجعة هذا الطلب مسبقًا ولا يمكن اعتماده مرة أخرى", "This request has already been reviewed and cannot be processed again"));
                        return [2 /*return*/];
                    }
                    if (action === "approve") {
                        parseOptionalNumber = function (value, labelAr, labelEn, options) {
                            var normalized = String(value || "").trim();
                            if (!normalized)
                                return undefined;
                            var parsed = Number(normalized);
                            if (!Number.isFinite(parsed)) {
                                sonner_1.toast.error(tr("\u0642\u064A\u0645\u0629 ".concat(labelAr, " \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629"), "Invalid ".concat(labelEn, " value")));
                                return null;
                            }
                            if (typeof (options === null || options === void 0 ? void 0 : options.min) === "number" && parsed < options.min) {
                                sonner_1.toast.error(tr("".concat(labelAr, " \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A ").concat(options.min), "".concat(labelEn, " must be greater than or equal to ").concat(options.min)));
                                return null;
                            }
                            return parsed;
                        };
                        weightValue = parseOptionalNumber(reviewUpdatesForm.packageWeight, "وزن الطرد", "package weight", { min: 0.1 });
                        if (weightValue === null)
                            return [2 /*return*/];
                        packageValue = parseOptionalNumber(reviewUpdatesForm.packageValue, "قيمة الطرد", "package value", { min: 0 });
                        if (packageValue === null)
                            return [2 /*return*/];
                        keepOrTrim = function (value, fallback) {
                            var normalized = String(value !== null && value !== void 0 ? value : "").trim();
                            return normalized || fallback;
                        };
                        baseSender = (selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) || {};
                        baseReceiver = ((_b = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _b === void 0 ? void 0 : _b[0]) || {};
                        basePackage = (selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) || {};
                        sender = __assign(__assign({}, baseSender), { name: keepOrTrim(reviewUpdatesForm.senderName, baseSender.name), phone: keepOrTrim(reviewUpdatesForm.senderPhone, baseSender.phone), email: keepOrTrim(reviewUpdatesForm.senderEmail, baseSender.email), city: keepOrTrim(reviewUpdatesForm.senderCity, baseSender.city), state: keepOrTrim(reviewUpdatesForm.senderState, baseSender.state), country: keepOrTrim(reviewUpdatesForm.senderCountry, baseSender.country), street: keepOrTrim(reviewUpdatesForm.senderStreet, baseSender.street) });
                        receiver = __assign(__assign({}, baseReceiver), { name: keepOrTrim(reviewUpdatesForm.receiverName, baseReceiver.name), phone: keepOrTrim(reviewUpdatesForm.receiverPhone, baseReceiver.phone), email: keepOrTrim(reviewUpdatesForm.receiverEmail, baseReceiver.email), city: keepOrTrim(reviewUpdatesForm.receiverCity, baseReceiver.city), state: keepOrTrim(reviewUpdatesForm.receiverState, baseReceiver.state), country: keepOrTrim(reviewUpdatesForm.receiverCountry, baseReceiver.country), street: keepOrTrim(reviewUpdatesForm.receiverStreet, baseReceiver.street) });
                        pkg = __assign(__assign({}, basePackage), { type: reviewUpdatesForm.packageType || basePackage.type || "documents", description: keepOrTrim(reviewUpdatesForm.packageDescription, basePackage.description), weight: weightValue !== undefined
                                ? weightValue
                                : Number((_c = basePackage.weight) !== null && _c !== void 0 ? _c : 0), length: reviewUpdatesForm.packageLength.trim() !== ""
                                ? Number(reviewUpdatesForm.packageLength)
                                : Number((_d = basePackage.length) !== null && _d !== void 0 ? _d : 0), width: reviewUpdatesForm.packageWidth.trim() !== ""
                                ? Number(reviewUpdatesForm.packageWidth)
                                : Number((_e = basePackage.width) !== null && _e !== void 0 ? _e : 0), height: reviewUpdatesForm.packageHeight.trim() !== ""
                                ? Number(reviewUpdatesForm.packageHeight)
                                : Number((_f = basePackage.height) !== null && _f !== void 0 ? _f : 0), value: packageValue !== undefined
                                ? packageValue
                                : Number((_g = basePackage.value) !== null && _g !== void 0 ? _g : 0), currency: reviewUpdatesForm.packageCurrency || basePackage.currency || "USD", fragile: reviewUpdatesForm.packageFragile === "true"
                                ? true
                                : reviewUpdatesForm.packageFragile === "false"
                                    ? false
                                    : Boolean(basePackage.fragile), packagingRequested: reviewUpdatesForm.packagePackagingRequested === "true"
                                ? true
                                : reviewUpdatesForm.packagePackagingRequested === "false"
                                    ? false
                                    : Boolean(basePackage.packagingRequested) });
                        updates = {};
                        updates.shippingMode = reviewUpdatesForm.shippingMode || (selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.shippingMode);
                        updates.sender = sender;
                        updates.receivers = [receiver];
                        updates.package = pkg;
                        shipmentUpdates = Object.keys(updates).length > 0 ? updates : undefined;
                    }
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, adminService_1.default.reviewEditRequest(selectedRequest._id, {
                            action: action,
                            shipmentUpdates: shipmentUpdates,
                        })];
                case 2:
                    response = _h.sent();
                    updatedCount = Array.isArray(response === null || response === void 0 ? void 0 : response.appliedUpdateFields)
                        ? response.appliedUpdateFields.length
                        : 0;
                    sonner_1.toast.success(action === "approve"
                        ? updatedCount > 0
                            ? tr("\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u062A\u0637\u0628\u064A\u0642 ".concat(updatedCount, " \u062D\u0642\u0644(\u062D\u0642\u0648\u0644) \u0639\u0644\u0649 \u0627\u0644\u0634\u062D\u0646\u0629"), "Approved and applied ".concat(updatedCount, " field(s) on shipment"))
                            : tr("تمت الموافقة على طلب التعديل", "Edit request approved")
                        : tr("تم رفض طلب التعديل", "Edit request rejected"));
                    setSelectedRequest(null);
                    fetchRequests();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _h.sent();
                    sonner_1.toast.error(error_2.message ||
                        tr("فشل معالجة طلب التعديل", "Failed to process edit request"));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var getStatusBadge = function (status) {
        if (status === "pending") {
            return (<badge_1.Badge className="bg-orange-100 text-orange-800">
          {tr("قيد المراجعة", "Under review")}
        </badge_1.Badge>);
        }
        if (status === "approved") {
            return (<badge_1.Badge className="bg-green-100 text-green-800">
          {tr("مقبول", "Approved")}
        </badge_1.Badge>);
        }
        if (status === "rejected") {
            return (<badge_1.Badge className="bg-red-100 text-red-800">
          {tr("مرفوض", "Rejected")}
        </badge_1.Badge>);
        }
        return <badge_1.Badge className="bg-gray-100 text-gray-800">-</badge_1.Badge>;
    };
    var getPreview = function (text) {
        var normalized = String(text || "").trim();
        if (!normalized)
            return "-";
        if (normalized.length <= 90)
            return normalized;
        return "".concat(normalized.slice(0, 90), "...");
    };
    var isSelectedRequestPending = ((_a = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.editRequest) === null || _a === void 0 ? void 0 : _a.status) === "pending";
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          طلبات تعديل الشحنات
        </h1>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
              <input_1.Input placeholder="البحث برقم التتبع، اسم المرسل أو المستلم..." value={search} onChange={function (e) {
            setPage(1);
            setSearch(e.target.value);
        }} className="pl-10"/>
            </div>
            <select value={companyId} onChange={function (e) {
            setPage(1);
            setCompanyId(e.target.value);
        }} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{tr("كل الشركات", "All companies")}</option>
              {companies.map(function (company) { return (<option key={company._id} value={company._id}>
                  {company.name}
                </option>); })}
            </select>
            <select value={statusFilter} onChange={function (e) {
            setPage(1);
            setStatusFilter(e.target.value);
        }} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {statusOptions.map(function (option) { return (<option key={option} value={option}>
                  {option === "all"
                ? tr("الكل", "All")
                : option === "pending"
                    ? tr("قيد المراجعة", "Under review")
                    : option === "approved"
                        ? tr("مقبول", "Approved")
                        : tr("مرفوض", "Rejected")}
                </option>); })}
            </select>
          </div>
        </card_1.CardHeader>

        <card_1.CardContent>
          {isLoading ? (<div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>) : (<>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table_1.Table className="w-full table-fixed">
                  <table_1.TableHeader>
                    <table_1.TableRow>
                      <table_1.TableHead>رقم التتبع</table_1.TableHead>
                      <table_1.TableHead>المستخدم</table_1.TableHead>
                      <table_1.TableHead>الشركة</table_1.TableHead>
                      <table_1.TableHead>سبب الطلب</table_1.TableHead>
                      <table_1.TableHead>التعديلات المطلوبة</table_1.TableHead>
                      <table_1.TableHead>حالة الطلب</table_1.TableHead>
                      <table_1.TableHead>تاريخ الطلب</table_1.TableHead>
                      <table_1.TableHead>الإجراءات</table_1.TableHead>
                    </table_1.TableRow>
                  </table_1.TableHeader>
                  <table_1.TableBody>
                    {requests.length === 0 ? (<table_1.TableRow>
                        <table_1.TableCell colSpan={8} className="text-center text-gray-500 py-6">
                          لا توجد طلبات تعديل حالياً
                        </table_1.TableCell>
                      </table_1.TableRow>) : (requests.map(function (shipment) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                return (<table_1.TableRow key={shipment._id} className="align-top">
                          <table_1.TableCell className="font-medium break-words">
                            {shipment.trackingNumber}
                          </table_1.TableCell>
                          <table_1.TableCell className="break-words">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {((_a = shipment.userId) === null || _a === void 0 ? void 0 : _a.name) || "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((_b = shipment.userId) === null || _b === void 0 ? void 0 : _b.email) || "-"}
                              </p>
                            </div>
                          </table_1.TableCell>
                          <table_1.TableCell className="text-sm break-words">
                            {((_c = shipment.shippingCompany) === null || _c === void 0 ? void 0 : _c.name) || "-"}
                          </table_1.TableCell>
                          <table_1.TableCell className="break-words">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {getPreview((_d = shipment.editRequest) === null || _d === void 0 ? void 0 : _d.reason)}
                              </p>
                              {String(((_e = shipment.editRequest) === null || _e === void 0 ? void 0 : _e.reason) || "").trim()
                        .length > 90 && (<button_1.Button size="sm" variant="ghost" className="h-auto p-0 text-blue-700 hover:text-blue-900" onClick={function () {
                            var _a;
                            return setSelectedText({
                                title: "\u0633\u0628\u0628 \u0637\u0644\u0628 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 (".concat(shipment.trackingNumber, ")"),
                                text: ((_a = shipment.editRequest) === null || _a === void 0 ? void 0 : _a.reason) || "",
                            });
                        }}>
                                  عرض كامل
                                </button_1.Button>)}
                            </div>
                          </table_1.TableCell>
                          <table_1.TableCell className="break-words">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {getPreview((_f = shipment.editRequest) === null || _f === void 0 ? void 0 : _f.requestedChanges)}
                              </p>
                              {String(((_g = shipment.editRequest) === null || _g === void 0 ? void 0 : _g.requestedChanges) || "").trim().length > 90 && (<button_1.Button size="sm" variant="ghost" className="h-auto p-0 text-blue-700 hover:text-blue-900" onClick={function () {
                            var _a;
                            return setSelectedText({
                                title: "\u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 (".concat(shipment.trackingNumber, ")"),
                                text: ((_a = shipment.editRequest) === null || _a === void 0 ? void 0 : _a.requestedChanges) || "",
                            });
                        }}>
                                  عرض كامل
                                </button_1.Button>)}
                            </div>
                          </table_1.TableCell>
                          <table_1.TableCell>
                            {getStatusBadge((_h = shipment.editRequest) === null || _h === void 0 ? void 0 : _h.status)}
                          </table_1.TableCell>
                          <table_1.TableCell className="text-sm">
                            {((_j = shipment.editRequest) === null || _j === void 0 ? void 0 : _j.requestedAt)
                        ? new Date(shipment.editRequest.requestedAt).toLocaleDateString("ar-SY")
                        : "-"}
                          </table_1.TableCell>
                          <table_1.TableCell>
                            <button_1.Button size="sm" variant="ghost" onClick={function () { return openReviewDialog(shipment); }}>
                              عرض
                            </button_1.Button>
                          </table_1.TableCell>
                        </table_1.TableRow>);
            }))}
                  </table_1.TableBody>
                </table_1.Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </p>
                <div className="flex gap-2">
                  <button_1.Button variant="outline" size="sm" onClick={function () { return setPage(page - 1); }} disabled={page === 1}>
                    السابق
                  </button_1.Button>
                  <button_1.Button variant="outline" size="sm" onClick={function () { return setPage(page + 1); }} disabled={page === totalPages}>
                    التالي
                  </button_1.Button>
                </div>
              </div>
            </>)}
        </card_1.CardContent>
      </card_1.Card>

      <dialog_1.Dialog open={Boolean(selectedText)} onOpenChange={function (open) { return !open && setSelectedText(null); }}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{(selectedText === null || selectedText === void 0 ? void 0 : selectedText.title) || ""}</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-slate-800">
              {(selectedText === null || selectedText === void 0 ? void 0 : selectedText.text) || "-"}
            </p>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      <dialog_1.Dialog open={Boolean(selectedRequest)} onOpenChange={function (open) { return !open && setSelectedRequest(null); }}>
        <dialog_1.DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>
              {tr("تفاصيل طلب التعديل", "Edit request details")}
            </dialog_1.DialogTitle>
          </dialog_1.DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-3 text-sm space-y-2">
              <p>
                <span className="font-medium">
                  {tr("رقم التتبع", "Tracking")}:{" "}
                </span>
                {(selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.trackingNumber) || "-"}
              </p>
              <p>
                <span className="font-medium">{tr("السبب", "Reason")}: </span>
                {((_b = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.editRequest) === null || _b === void 0 ? void 0 : _b.reason) || "-"}
              </p>
              <p>
                <span className="font-medium">
                  {tr("التعديلات المطلوبة", "Requested changes")}:
                </span>
                {((_c = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.editRequest) === null || _c === void 0 ? void 0 : _c.requestedChanges) || "-"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-4">
              <p className="font-semibold text-slate-900">
                {tr("تفاصيل الشحنة الحالية", "Current shipment details")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("الشركة", "Company")}</p>
                  <p>{((_d = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.shippingCompany) === null || _d === void 0 ? void 0 : _d.name) || "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("طريقة الدفع", "Payment method")}</p>
                  <p>{((_e = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.cost) === null || _e === void 0 ? void 0 : _e.paymentMethod) || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("بيانات المرسل", "Sender details")}</p>
                  <p>{((_f = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _f === void 0 ? void 0 : _f.name) || "-"}</p>
                  <p>{((_g = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _g === void 0 ? void 0 : _g.phone) || "-"}</p>
                  <p>{((_h = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _h === void 0 ? void 0 : _h.email) || "-"}</p>
                  <p>{((_j = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _j === void 0 ? void 0 : _j.street) || ((_k = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _k === void 0 ? void 0 : _k.address) || "-"}</p>
                  <p>
                    {((_l = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _l === void 0 ? void 0 : _l.city) || "-"} - {((_m = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.sender) === null || _m === void 0 ? void 0 : _m.country) || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("بيانات المستلم", "Receiver details")}</p>
                  <p>{((_p = (_o = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.name) || "-"}</p>
                  <p>{((_r = (_q = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.phone) || "-"}</p>
                  <p>{((_t = (_s = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.email) || "-"}</p>
                  <p>{((_v = (_u = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.street) || ((_x = (_w = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.address) || "-"}</p>
                  <p>
                    {((_z = (_y = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.city) || "-"} - {((_1 = (_0 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.receivers) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.country) || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("نوع الطرد", "Package type")}</p>
                  <p>{((_2 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _2 === void 0 ? void 0 : _2.type) ? t("package.".concat(selectedRequest.package.type)) : "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("الوزن", "Weight")}</p>
                  <p>{((_3 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _3 === void 0 ? void 0 : _3.weight) ? "".concat(selectedRequest.package.weight, " kg") : "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("القيمة", "Value")}</p>
                  <p>
                    {((_4 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _4 === void 0 ? void 0 : _4.value)
            ? "".concat(selectedRequest.package.value, " ").concat(selectedRequest.package.currency || "")
            : "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("الأبعاد", "Dimensions")}</p>
                  <p>
                    {(((_5 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _5 === void 0 ? void 0 : _5.length) || ((_6 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _6 === void 0 ? void 0 : _6.width) || ((_7 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _7 === void 0 ? void 0 : _7.height))
            ? "".concat(selectedRequest.package.length || "-", " x ").concat(selectedRequest.package.width || "-", " x ").concat(selectedRequest.package.height || "-", " cm")
            : ((_8 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _8 === void 0 ? void 0 : _8.dimensions) || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("قابل للكسر", "Fragile")}</p>
                  <p>{((_9 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _9 === void 0 ? void 0 : _9.fragile) ? tr("نعم", "Yes") : tr("لا", "No")}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("التغليف", "Packaging")}</p>
                  <p>{((_10 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _10 === void 0 ? void 0 : _10.packagingRequested) ? tr("تم الطلب", "Requested") : tr("لم يتم الطلب", "Not requested")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">{tr("وصف الطرد", "Package description")}</p>
                <p>{((_11 = selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.package) === null || _11 === void 0 ? void 0 : _11.description) || "-"}</p>
              </div>
            </div>

            {isSelectedRequestPending && (<div className="space-y-4 rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-800">
                  {tr("بيانات الشحنة القابلة للتعديل", "Editable shipment fields")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label_1.Label>{tr("طريقة الشحن", "Shipping mode")}</label_1.Label>
                    <select value={reviewUpdatesForm.shippingMode} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { shippingMode: e.target.value })); });
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{tr("اختر نوع الشحن", "Select shipping mode")}</option>
                      <option value="standard">{tr("عادي", "Standard")}</option>
                      <option value="express">{tr("سريع", "Express")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("نوع الطرد", "Package type")}</label_1.Label>
                    <select value={reviewUpdatesForm.packageType} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageType: e.target.value })); });
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{tr("اختر نوع الطرد", "Select package type")}</option>
                      <option value="documents">{t("package.documents")}</option>
                      <option value="electronics">{t("package.electronics")}</option>
                      <option value="clothing">{t("package.clothing")}</option>
                      <option value="books">{t("package.books")}</option>
                      <option value="gifts">{t("package.gifts")}</option>
                      <option value="food">{t("package.food")}</option>
                      <option value="other">{t("package.other")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label_1.Label>{tr("اسم المرسل", "Sender name")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderName} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderName: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("هاتف المرسل", "Sender phone")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderPhone} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderPhone: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("البريد الإلكتروني للمرسل", "Sender email")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderEmail} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderEmail: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("مدينة المرسل", "Sender city")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderCity} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderCity: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("الولاية/المحافظة", "Sender state")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderState} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderState: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("البلد", "Sender country")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderCountry} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderCountry: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("عنوان المرسل", "Sender street")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.senderStreet} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { senderStreet: e.target.value })); });
            }}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label_1.Label>{tr("اسم المستلم", "Receiver name")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverName} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverName: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("هاتف المستلم", "Receiver phone")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverPhone} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverPhone: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("البريد الإلكتروني للمستلم", "Receiver email")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverEmail} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverEmail: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("مدينة المستلم", "Receiver city")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverCity} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverCity: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("الولاية/المحافظة", "Receiver state")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverState} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverState: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("البلد", "Receiver country")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverCountry} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverCountry: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("عنوان المستلم", "Receiver street")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.receiverStreet} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { receiverStreet: e.target.value })); });
            }}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-3">
                    <label_1.Label>{tr("وصف الطرد", "Package description")}</label_1.Label>
                    <input_1.Input value={reviewUpdatesForm.packageDescription} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageDescription: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("وزن الطرد", "Package weight")}</label_1.Label>
                    <input_1.Input type="number" min="0.1" step="0.1" value={reviewUpdatesForm.packageWeight} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageWeight: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("قيمة الطرد", "Package value")}</label_1.Label>
                    <input_1.Input type="number" min="0" step="0.01" value={reviewUpdatesForm.packageValue} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageValue: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("العملة", "Currency")}</label_1.Label>
                    <select value={reviewUpdatesForm.packageCurrency} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageCurrency: e.target.value })); });
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{tr("اختر العملة", "Select currency")}</option>
                      <option value="USD">USD</option>
                      <option value="SYP">SYP</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("طول الطرد", "Length (cm)")}</label_1.Label>
                    <input_1.Input type="number" min="0" step="0.1" value={reviewUpdatesForm.packageLength} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageLength: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("عرض الطرد", "Width (cm)")}</label_1.Label>
                    <input_1.Input type="number" min="0" step="0.1" value={reviewUpdatesForm.packageWidth} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageWidth: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("ارتفاع الطرد", "Height (cm)")}</label_1.Label>
                    <input_1.Input type="number" min="0" step="0.1" value={reviewUpdatesForm.packageHeight} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageHeight: e.target.value })); });
            }}/>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("قابل للكسر", "Fragile")}</label_1.Label>
                    <select value={reviewUpdatesForm.packageFragile} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packageFragile: e.target.value })); });
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{tr("اختر", "Select")}</option>
                      <option value="true">{tr("نعم", "Yes")}</option>
                      <option value="false">{tr("لا", "No")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label_1.Label>{tr("التغليف", "Packaging")}</label_1.Label>
                    <select value={reviewUpdatesForm.packagePackagingRequested} onChange={function (e) {
                return setReviewUpdatesForm(function (prev) { return (__assign(__assign({}, prev), { packagePackagingRequested: e.target.value })); });
            }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{tr("اختر", "Select")}</option>
                      <option value="true">{tr("تم الطلب", "Requested")}</option>
                      <option value="false">{tr("لم يتم الطلب", "Not requested")}</option>
                    </select>
                  </div>
                </div>
              </div>)}

            <div className="flex items-center justify-end gap-2">
              <button_1.Button variant="outline" onClick={function () { return setSelectedRequest(null); }}>
                {tr("إلغاء", "Cancel")}
              </button_1.Button>
              {isSelectedRequestPending && (<>
                  <button_1.Button variant="outline" className="text-red-700 border-red-300" onClick={function () { return submitReview("reject"); }}>
                    {tr("رفض", "Reject")}
                  </button_1.Button>
                  <button_1.Button onClick={function () { return submitReview("approve"); }}>
                    {tr("تعديل", "Edit")}
                  </button_1.Button>
                </>)}
            </div>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
