import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, RefreshCw, Search } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface SettlementRow {
  _id: string;
  reference: string;
  trackingNumber: string;
  customer: {
    name: string;
    email: string;
  };
  amount: number;
  baseAmount: number;
  codFee: number;
  currency: string;
  paymentMethod: string;
  shipmentStatus: string;
  createdAt: string;
}

interface Summary {
  totalAmount: number;
  totalBaseAmount: number;
  totalCodFees: number;
  platformCollected: number;
  codCollected: number;
  deliveredAmount: number;
}

export default function ComparisonInvoices() {
  const LAST_IMPORT_RESULT_STORAGE_KEY =
    "comparison_invoices_last_import_result";
  const { user } = useAuth();
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);

  const translateImportErrorMessage = (message: string) => {
    const normalized = String(message || "").trim();
    const map: Record<string, { ar: string; en: string }> = {
      "Excel file is required": {
        ar: "ملف Excel مطلوب",
        en: "Excel file is required",
      },
      "Excel file does not contain any worksheet": {
        ar: "ملف Excel لا يحتوي على أي ورقة عمل",
        en: "Excel file does not contain any worksheet",
      },
      "No valid rows found in the uploaded Excel file": {
        ar: "لم يتم العثور على صفوف صالحة في ملف Excel المرفوع",
        en: "No valid rows found in the uploaded Excel file",
      },
      "Missing tracking number or reference": {
        ar: "رقم الشحنة أو المرجع مفقود",
        en: "Missing tracking number or reference",
      },
      "Shipment not found in current scope": {
        ar: "لم يتم العثور على الشحنة ضمن النطاق الحالي",
        en: "Shipment not found in current scope",
      },
      "Row does not contain a valid status or weight": {
        ar: "الصف لا يحتوي على حالة أو وزن صالح",
        en: "Row does not contain a valid status or weight",
      },
      "Comparison invoice imported successfully": {
        ar: "تم استيراد فاتورة المقارنة بنجاح",
        en: "Comparison invoice imported successfully",
      },
      "Error importing comparison invoice": {
        ar: "حدث خطأ أثناء استيراد فاتورة المقارنة",
        en: "Error importing comparison invoice",
      },
      "Company scope is required": {
        ar: "يجب تحديد نطاق الشركة",
        en: "Company scope is required",
      },
    };

    if (!normalized) {
      return tr("حدث خطأ غير متوقع", "Unexpected error");
    }

    const translated = map[normalized];
    return translated ? tr(translated.ar, translated.en) : normalized;
  };

  const isPlatformAdmin = ["admin", "super-admin"].includes(user?.role || "");

  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalAmount: 0,
    totalBaseAmount: 0,
    totalCodFees: 0,
    platformCollected: 0,
    codCollected: 0,
    deliveredAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<any | null>(null);
  const [showAllImportErrors, setShowAllImportErrors] = useState(false);
  const [search, setSearch] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(LAST_IMPORT_RESULT_STORAGE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") {
        setLastImportResult(parsed);
      }
    } catch (error) {
      sessionStorage.removeItem(LAST_IMPORT_RESULT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (isPlatformAdmin) {
      loadCompanies();
    }
  }, [isPlatformAdmin]);

  useEffect(() => {
    loadData();
  }, [
    search,
    shipmentStatus,
    paymentMethod,
    currency,
    dateFrom,
    dateTo,
    companyId,
    page,
  ]);

  const loadCompanies = async () => {
    try {
      const response = await adminService.getAllCompanies({ limit: 500 });
      setCompanies(response?.data || []);
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تحميل الشركات", "Failed to load companies"),
      );
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      const response = await adminService.getAllTransactions({
        scope: "company-settlement",
        companyId: isPlatformAdmin ? companyId || undefined : undefined,
        search: search || undefined,
        shipmentStatus: shipmentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        currency: currency || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 20,
      });

      const extractCustomerName = (item: any) => {
        const directCandidates = [
          item?.customer?.name,
          item?.customer?.fullName,
          item?.customerName,
          item?.user?.name,
          item?.userName,
          item?.sender?.name,
          item?.recipient?.name,
          item?.shipment?.customer?.name,
          item?.shipment?.customerName,
        ];

        for (const value of directCandidates) {
          const normalized = String(value || "").trim();
          if (normalized) return normalized;
        }

        const firstName = String(
          item?.customer?.firstName || item?.user?.firstName || "",
        ).trim();
        const lastName = String(
          item?.customer?.lastName || item?.user?.lastName || "",
        ).trim();
        const fullName = `${firstName} ${lastName}`.trim();

        return fullName || "-";
      };

      const normalizedRows: SettlementRow[] = Array.isArray(response?.data)
        ? response.data.map((item: any) => ({
            _id: String(item?._id || item?.id || ""),
            reference: String(item?.reference || item?.ref || "-"),
            trackingNumber: String(
              item?.trackingNumber ||
                item?.tracking ||
                item?.shipmentTrackingNumber ||
                "-",
            ),
            customer: {
              name: extractCustomerName(item),
              email: String(
                item?.customer?.email ||
                  item?.user?.email ||
                  item?.sender?.email ||
                  "-",
              ),
            },
            amount: Number(item?.amount || 0),
            baseAmount: Number(item?.baseAmount || 0),
            codFee: Number(item?.codFee || 0),
            currency: String(item?.currency || ""),
            paymentMethod: String(item?.paymentMethod || item?.method || ""),
            shipmentStatus: String(item?.shipmentStatus || item?.status || ""),
            createdAt: String(
              item?.createdAt || item?.date || new Date().toISOString(),
            ),
          }))
        : [];

      setRows(normalizedRows);
      setSummary(
        response?.summary || {
          totalAmount: 0,
          totalBaseAmount: 0,
          totalCodFees: 0,
          platformCollected: 0,
          codCollected: 0,
          deliveredAmount: 0,
        },
      );
      setTotalPages(response?.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل فواتير المقارنة", "Failed to load comparison invoices"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await adminService.exportCompanySettlementExcel({
        companyId: isPlatformAdmin ? companyId || undefined : undefined,
        search: search || undefined,
        shipmentStatus: shipmentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        currency: currency || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        language: language === "ar" ? "ar" : "en",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comparison-invoices-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(tr("تم تصدير Excel بنجاح", "Excel exported successfully"));
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تصدير Excel", "Failed to export Excel"),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      // Clear previous import state so only the latest result is displayed.
      setLastImportResult(null);
      sessionStorage.removeItem(LAST_IMPORT_RESULT_STORAGE_KEY);
      setShowAllImportErrors(false);
      setIsImporting(true);
      const response = await adminService.importComparisonInvoices(file);
      const result = response?.data || null;
      setLastImportResult(result);
      if (result) {
        sessionStorage.setItem(
          LAST_IMPORT_RESULT_STORAGE_KEY,
          JSON.stringify(result),
        );
      }
      toast.success(
        tr(
          "تم استيراد الملف ومطابقة الشحنات بنجاح",
          "Excel file imported and matched successfully",
        ),
      );
      await loadData();
    } catch (error: any) {
      toast.error(
        translateImportErrorMessage(
          error.message ||
            tr("فشل استيراد الملف", "Failed to import Excel file"),
        ),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const formatAmount = (value: number) =>
    Number(value || 0).toLocaleString("en-US");

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getMethodLabel = (method: string) => {
    const normalize = (s: string) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");

    const key = normalize(method);

    const map: Record<string, { ar: string; en: string }> = {
      // Wallet variants
      wallet: { ar: "المحفظة", en: "Wallet" },
      walletbalance: { ar: "رصيد المحفظة", en: "Wallet Balance" },
      // Cash on delivery variants
      cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
      cashondelivery: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
      cashondel: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
      cashondeliverypaid: {
        ar: "دفع عند الاستلام - مدفوع",
        en: "Cash on Delivery - Paid",
      },
      cashondeliveryunpaid: {
        ar: "دفع عند الاستلام - غير مدفوع",
        en: "Cash on Delivery - Unpaid",
      },
      cash: { ar: "نقداً", en: "Cash" },
      // Card / credit
      card: { ar: "بطاقة", en: "Card" },
      creditcard: { ar: "بطاقة ائتمان", en: "Credit Card" },
      debitcard: { ar: "بطاقة خصم", en: "Debit Card" },
      // Bank / transfer
      banktransfer: { ar: "تحويل بنكي", en: "Bank Transfer" },
      bank: { ar: "بنك", en: "Bank" },
      // Third party
      paypal: { ar: "باي بال", en: "PayPal" },
      mobilepayment: { ar: "دفع عبر الموبايل", en: "Mobile Payment" },
      mobilepay: { ar: "دفع عبر الموبايل", en: "Mobile Payment" },
      digitalwallet: { ar: "محفظة رقمية", en: "Digital Wallet" },
      syriatelcash: { ar: "سيريتل كاش", en: "Syriatel Cash" },
      mtncash: { ar: "MTN كاش", en: "MTN Cash" },
      // Arabic literal values
      دفععبرالموبايل: { ar: "دفع عبر الموبايل", en: "Mobile Payment" },
      محفظةرقمية: { ar: "محفظة رقمية", en: "Digital Wallet" },
      سيريتلكاش: { ar: "سيريتل كاش", en: "Syriatel Cash" },
      // Payment status-like values sometimes returned by APIs
      paid: { ar: "مدفوع", en: "Paid" },
      unpaid: { ar: "غير مدفوع", en: "Unpaid" },
      pending: { ar: "قيد الانتظار", en: "Pending" },
      failed: { ar: "فشل الدفع", en: "Failed" },
      refunded: { ar: "مسترجع", en: "Refunded" },
      partiallyrefunded: { ar: "مسترجع جزئياً", en: "Partially Refunded" },
      paymentpending: { ar: "الدفع قيد الانتظار", en: "Payment Pending" },
      paymentfailed: { ar: "فشل الدفع", en: "Payment Failed" },
      partiallypaid: { ar: "مدفوع جزئياً", en: "Partially Paid" },
      notpaid: { ar: "غير مدفوع", en: "Not Paid" },
    };

    if (map[key]) {
      return language === "ar" ? map[key].ar : map[key].en;
    }

    // Fallback based on selected language.
    if (!method) return "-";
    return language === "ar" ? method : method;
  };

  const getShipmentStatusLabel = (status: string) => {
    const normalize = (s: string) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");

    const key = normalize(status);

    const map: Record<string, { ar: string; en: string }> = {
      // Pending / waiting
      pending: { ar: "معلقة", en: "Pending" },
      awaiting: { ar: "معلقة", en: "Pending" },
      waiting: { ar: "معلقة", en: "Pending" },
      onhold: { ar: "معلقة", en: "Pending" },
      // Confirmed / accepted
      confirmed: { ar: "مؤكدة", en: "Confirmed" },
      accepted: { ar: "مؤكدة", en: "Confirmed" },
      assigned: { ar: "مؤكدة", en: "Confirmed" },
      // Picked up / collected
      pickedup: { ar: "تم الاستلام", en: "Picked Up" },
      picked: { ar: "تم الاستلام", en: "Picked Up" },
      collected: { ar: "تم الاستلام", en: "Picked Up" },
      // In transit
      intransit: { ar: "قيد النقل", en: "In Transit" },
      transit: { ar: "قيد النقل", en: "In Transit" },
      // Out for delivery
      outfordelivery: { ar: "خارج للتسليم", en: "Out for Delivery" },
      outdelivery: { ar: "خارج للتسليم", en: "Out for Delivery" },
      // Delivered
      delivered: { ar: "تم التسليم", en: "Delivered" },
      completed: { ar: "تم التسليم", en: "Delivered" },
      // Cancelled
      cancelled: { ar: "ملغاة", en: "Cancelled" },
      canceled: { ar: "ملغاة", en: "Cancelled" },
      // Returned
      returned: { ar: "مرتجعة", en: "Returned" },
      returnedtowarehouse: {
        ar: "تم الإرجاع للمستودع",
        en: "Returned to Warehouse",
      },
      faileddelivery: { ar: "فشل التسليم", en: "Delivery Failed" },
      // Arabic literal words (normalized keys)
      معلقة: { ar: "معلقة", en: "Pending" },
      قيدالانتظار: { ar: "معلقة", en: "Pending" },
      مؤكد: { ar: "مؤكدة", en: "Confirmed" },
      مؤكدة: { ar: "مؤكدة", en: "Confirmed" },
      تمالاستلام: { ar: "تم الاستلام", en: "Picked Up" },
      قيدالنقل: { ar: "قيد النقل", en: "In Transit" },
      خارجللتسليم: { ar: "خارج للتسليم", en: "Out for Delivery" },
      تمالتسليم: { ar: "تم التسليم", en: "Delivered" },
      ملغاة: { ar: "ملغاة", en: "Cancelled" },
      مرتجعة: { ar: "مرتجعة", en: "Returned" },
      فشلالتسليم: { ar: "فشل التسليم", en: "Delivery Failed" },
    };

    if (map[key]) return language === "ar" ? map[key].ar : map[key].en;

    // Fallback: return trimmed original status or a capitalized English fallback
    const original = String(status || "").trim();
    if (!original) return "-";
    if (language === "ar") return original;
    // Capitalize words for english fallback
    return original
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const currentCompanyName = useMemo(() => {
    if (!isPlatformAdmin) return tr("شركتي", "My Company");
    const company = companies.find((c) => c._id === companyId);
    return company?.name || tr("كل الشركات", "All Companies");
  }, [companyId, companies, isPlatformAdmin, language]);

  const importDiffStats = useMemo(() => {
    const updates = Array.isArray(lastImportResult?.updates)
      ? lastImportResult.updates
      : [];

    const changedFromUpdates = updates.filter((item: any) => {
      const statusChanged = item.previousStatus !== item.currentStatus;
      const previousWeight = Number(item.previousWeight || 0);
      const currentWeight = Number(item.currentWeight || 0);
      const weightChanged = Math.abs(previousWeight - currentWeight) > 0.0001;
      return statusChanged || weightChanged;
    }).length;

    const matched = Number(lastImportResult?.matched || 0);
    const changed = Number.isFinite(Number(lastImportResult?.changed))
      ? Number(lastImportResult.changed)
      : changedFromUpdates;
    const unchanged = Number.isFinite(Number(lastImportResult?.unchanged))
      ? Number(lastImportResult.unchanged)
      : Math.max(0, matched - changed);
    const hasNoDifferences = matched > 0 && changed === 0;

    return {
      changed,
      unchanged,
      hasNoDifferences,
    };
  }, [lastImportResult]);

  const importErrors = useMemo(
    () =>
      Array.isArray(lastImportResult?.errors) ? lastImportResult.errors : [],
    [lastImportResult],
  );

  const visibleImportErrors = useMemo(() => {
    if (showAllImportErrors) {
      return importErrors;
    }
    return importErrors.slice(0, 50);
  }, [importErrors, showAllImportErrors]);

  const comparisonStatus = useMemo(() => {
    if (!lastImportResult) return null;

    if (importDiffStats.hasNoDifferences) {
      return {
        key: "identical",
        label: tr("مطابقة بالكامل", "Fully Matched"),
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    }

    if ((lastImportResult.matched || 0) > 0) {
      return {
        key: "differences",
        label: tr("يوجد اختلافات", "Differences Found"),
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }

    return {
      key: "no-match",
      label: tr("لا توجد مطابقة", "No Matches Found"),
      className: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }, [importDiffStats.hasNoDifferences, lastImportResult, language]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {tr("فواتير المقارنة", "Comparison Invoices")}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="inline-flex">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
              disabled={isImporting}
            />
            <span className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
              {isImporting
                ? tr("جارٍ الاستيراد...", "Importing...")
                : tr("رفع ملف المقارنة", "Upload Comparison Excel")}
            </span>
          </label>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {tr("تصدير Excel", "Export Excel")}
          </Button>
        </div>
      </div>

      {lastImportResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>
                {tr("نتيجة آخر استيراد", "Last Import Result")}
              </CardTitle>
              {comparisonStatus && (
                <Badge className={comparisonStatus.className}>
                  {tr("حالة المقارنة", "Comparison Status")}:{" "}
                  {comparisonStatus.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">
                  {tr("إجمالي الصفوف", "Total Rows")}
                </p>
                <p className="text-xl font-bold">
                  {lastImportResult.totalRows || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">
                  {tr("تمت المطابقة", "Matched")}
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {lastImportResult.matched || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">
                  {tr("تم التحديث", "Updated")}
                </p>
                <p className="text-xl font-bold text-green-700">
                  {lastImportResult.updated || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">
                  {tr("تم التخطي", "Skipped")}
                </p>
                <p className="text-xl font-bold text-amber-700">
                  {lastImportResult.skipped || 0}
                </p>
              </div>
            </div>

            {importDiffStats.hasNoDifferences ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    {tr(
                      "لا توجد أي اختلافات بين ملف المقارنة وبيانات النظام.",
                      "No differences were found between the comparison file and system data.",
                    )}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {tr("عدد الصفوف المتطابقة", "Matched rows")}:{" "}
                    {importDiffStats.unchanged}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">
                  {tr(
                    "تم العثور على اختلافات في نتيجة المقارنة الأخيرة.",
                    "Differences were found in the latest comparison result.",
                  )}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {tr("عدد الصفوف التي فيها اختلاف", "Rows with differences")}:{" "}
                  {importDiffStats.changed}
                </p>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-800 mb-2">
                  {tr("أخطاء الاستيراد", "Import Errors")}:{" "}
                  {importErrors.length}
                </p>

                <div className="space-y-2 text-sm text-red-700 max-h-72 overflow-auto pr-2">
                  {visibleImportErrors.map((item: any, index: number) => (
                    <p key={`${item.rowNumber}-${index}`}>
                      {tr("الصف", "Row")} {item.rowNumber}:{" "}
                      {translateImportErrorMessage(item.message)}
                    </p>
                  ))}
                </div>

                {importErrors.length > 50 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowAllImportErrors((prev) => !prev)}
                  >
                    {showAllImportErrors
                      ? tr("عرض أقل", "Show Less")
                      : tr(
                          `عرض كل الأخطاء (${importErrors.length})`,
                          `Show all errors (${importErrors.length})`,
                        )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {isPlatformAdmin && (
              <select
                value={companyId}
                onChange={(e) => {
                  setPage(1);
                  setCompanyId(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{tr("كل الشركات", "All Companies")}</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder={tr(
                  "بحث برقم التتبع أو المرجع",
                  "Search by tracking number or reference",
                )}
                className="pl-10"
              />
            </div>

            <select
              value={shipmentStatus}
              onChange={(e) => {
                setPage(1);
                setShipmentStatus(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">
                {tr("كل حالات الشحن", "All Shipment Statuses")}
              </option>
              <option value="pending">{tr("معلقة", "Pending")}</option>
              <option value="confirmed">{tr("مؤكدة", "Confirmed")}</option>
              <option value="in-transit">
                {tr("قيد النقل", "In Transit")}
              </option>
              <option value="delivered">{tr("تم التسليم", "Delivered")}</option>
              <option value="cancelled">{tr("ملغاة", "Cancelled")}</option>
              <option value="returned">{tr("مرتجعة", "Returned")}</option>
            </select>

            <select
              value={paymentMethod}
              onChange={(e) => {
                setPage(1);
                setPaymentMethod(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">
                {tr("كل طرق الدفع", "All Payment Methods")}
              </option>
              <option value="wallet">{tr("المحفظة", "Wallet")}</option>
              <option value="cod">
                {tr("الدفع عند الاستلام", "Cash on Delivery")}
              </option>
            </select>

            <select
              value={currency}
              onChange={(e) => {
                setPage(1);
                setCurrency(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{tr("كل العملات", "All Currencies")}</option>
              <option value="SYP">SYP</option>
              <option value="USD">USD</option>
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
            />

            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {tr("تحديث", "Refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {tr("النطاق", "Scope")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{currentCompanyName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {tr("إجمالي الأساس", "Total Base")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {formatAmount(summary.totalBaseAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {tr("إجمالي الرسوم", "Total Fees")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">
              {formatAmount(summary.totalCodFees)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {tr("الإجمالي", "Grand Total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-700">
              {formatAmount(summary.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {tr("رقم البوليصة", "Policy Number")}
                      </TableHead>
                      <TableHead>{tr("العميل", "Customer")}</TableHead>
                      <TableHead>
                        {tr("حالة الشحنة", "Shipment Status")}
                      </TableHead>
                      <TableHead>
                        {tr("طريقة الدفع", "Payment Method")}
                      </TableHead>
                      <TableHead>
                        {tr("المبلغ الأساسي", "Base Amount")}
                      </TableHead>
                      <TableHead>{tr("الرسوم", "Fees")}</TableHead>
                      <TableHead>{tr("الإجمالي", "Total")}</TableHead>
                      <TableHead>{tr("العملة", "Currency")}</TableHead>
                      <TableHead>{tr("التاريخ", "Date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>
                          {row.reference && row.reference !== "-"
                            ? row.reference
                            : row.trackingNumber || "-"}
                        </TableCell>
                        <TableCell>{row.customer?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {row.shipmentStatus
                              ? getShipmentStatusLabel(row.shipmentStatus)
                              : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.paymentMethod
                            ? getMethodLabel(row.paymentMethod)
                            : "-"}
                        </TableCell>
                        <TableCell>{formatAmount(row.baseAmount)}</TableCell>
                        <TableCell>{formatAmount(row.codFee)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(row.amount)}
                        </TableCell>
                        <TableCell>{row.currency}</TableCell>
                        <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-gray-500"
                        >
                          {tr("لا توجد بيانات مطابقة", "No matching records")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  {tr(
                    `صفحة ${page} من ${totalPages}`,
                    `Page ${page} of ${totalPages}`,
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    {tr("السابق", "Previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                  >
                    {tr("التالي", "Next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
