import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  XCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import walletService from "@/services/walletService";

type Currency = "SYP" | "USD";
type TransactionType =
  | "all"
  | "deposit"
  | "withdrawal"
  | "payment"
  | "refund"
  | "fee"
  | "commission";
type TransactionStatus =
  | "all"
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";
type FilterCurrency = "all" | Currency;

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment" | "refund" | "fee" | "commission";
  amount: number;
  currency: Currency;
  status: "pending" | "completed" | "failed" | "cancelled";
  method: string;
  date: string;
  createdAt: string;
  reference?: string;
  notes?: string;
}

export default function FinancialTransactions() {
  const { t, isRTL, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TransactionType>("all");
  const [filterCurrency, setFilterCurrency] = useState<FilterCurrency>("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await walletService.getTransactions({ limit: 500 });
      const mapped: Transaction[] = (response?.data || []).map(
        (transaction: any) => ({
          id: transaction._id,
          type: transaction.type,
          amount: Number(transaction.amount) || 0,
          currency: transaction.currency,
          status: transaction.status,
          method: transaction.method || "-",
          date: new Date(transaction.createdAt).toLocaleString(
            isRTL ? "ar-SY" : "en-US",
          ),
          createdAt: transaction.createdAt,
          reference: transaction.reference || "",
          notes: transaction.description || "",
        }),
      );
      setTransactions(mapped);
    } catch (error: any) {
      toast.error(
        error.message ||
          (isRTL ? "فشل تحميل المعاملات" : "Failed to load transactions"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        transaction.reference?.toLowerCase().includes(searchLower) ||
        transaction.method.toLowerCase().includes(searchLower) ||
        transaction.date.toLowerCase().includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower);

      const matchesType =
        filterType === "all" || transaction.type === filterType;
      const matchesCurrency =
        filterCurrency === "all" || transaction.currency === filterCurrency;
      const matchesStatus =
        filterStatus === "all" || transaction.status === filterStatus;

      const transactionDate = new Date(transaction.createdAt);
      const fromDate = filterDateFrom
        ? new Date(`${filterDateFrom}T00:00:00`)
        : null;
      const toDate = filterDateTo ? new Date(`${filterDateTo}T23:59:59`) : null;
      const matchesDateFrom = !fromDate || transactionDate >= fromDate;
      const matchesDateTo = !toDate || transactionDate <= toDate;
      const matchesDate = matchesDateFrom && matchesDateTo;

      return (
        matchesSearch &&
        matchesType &&
        matchesCurrency &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    transactions,
    searchQuery,
    filterType,
    filterCurrency,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === "SYP") {
      return `${amount.toLocaleString(isRTL ? "ar-SY" : "en-US")} ${t("syrianPoundSymbol")}`;
    }
    return `${t("dollarSymbol")}${amount.toFixed(2)}`;
  };

  const getCurrencyLabel = (currency: Currency) => {
    return currency === "SYP"
      ? t("syrianPoundWithCode")
      : t("usDollarWithCode");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "destructive",
    } as const;

    const statusLabels: Record<string, { ar: string; en: string }> = {
      completed: { ar: "مكتملة", en: "Completed" },
      pending: { ar: "معلقة", en: "Pending" },
      failed: { ar: "فاشلة", en: "Failed" },
      cancelled: { ar: "ملغاة", en: "Cancelled" },
    };

    const label = statusLabels[status]
      ? isRTL
        ? statusLabels[status].ar
        : statusLabels[status].en
      : status;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {label}
      </Badge>
    );
  };

  const getTypeLabel = (type: Transaction["type"]) => {
    const typeLabels: Record<Transaction["type"], { ar: string; en: string }> =
      {
        deposit: { ar: "إيداع", en: "Deposit" },
        withdrawal: { ar: "سحب", en: "Withdrawal" },
        payment: { ar: "دفع", en: "Payment" },
        refund: { ar: "استرداد", en: "Refund" },
        fee: { ar: "رسوم", en: "Fee" },
        commission: { ar: "عمولة", en: "Commission" },
      };

    if (typeLabels[type]) {
      return isRTL ? typeLabels[type].ar : typeLabels[type].en;
    }

    switch (type) {
      case "deposit":
        return t("deposit");
      case "withdrawal":
        return t("withdrawal");
      case "payment":
        return t("balance.payment");
      case "refund":
        return t("refund");
      case "fee":
        return t("fee");
      case "commission":
        return t("commission");
      default:
        return type;
    }
  };

  const getMethodLabel = (method: string) => {
    const methodLabels: Record<string, { ar: string; en: string }> = {
      wallet: { ar: "المحفظة", en: "Wallet" },
      cash: { ar: "نقدي", en: "Cash" },
      card: { ar: "بطاقة", en: "Card" },
      "bank-transfer": { ar: "تحويل بنكي", en: "Bank Transfer" },
      "mobile-payment": { ar: "محفظة إلكترونية", en: "Mobile Wallet" },
      cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
    };

    if (methodLabels[method]) {
      return isRTL ? methodLabels[method].ar : methodLabels[method].en;
    }

    return method || "-";
  };

  const getStatusLabelText = (status: string) => {
    const statusLabels: Record<string, { ar: string; en: string }> = {
      completed: { ar: "مكتملة", en: "Completed" },
      pending: { ar: "معلقة", en: "Pending" },
      failed: { ar: "فاشلة", en: "Failed" },
      cancelled: { ar: "ملغاة", en: "Cancelled" },
    };
    return statusLabels[status]
      ? isRTL
        ? statusLabels[status].ar
        : statusLabels[status].en
      : status;
  };

  const getNotesLabel = (notes?: string) => {
    const raw = String(notes || "").trim();
    if (!raw) return "-";

    const refundCancelledShipmentPattern =
      /Refund for cancelled shipment\s+([A-Za-z0-9-]+)/i;
    const refundCancelledShipmentMatch = raw.match(
      refundCancelledShipmentPattern,
    );
    if (refundCancelledShipmentMatch) {
      return isRTL
        ? `استرداد لشحنة ملغاة ${refundCancelledShipmentMatch[1]}`
        : `Refund for cancelled shipment ${refundCancelledShipmentMatch[1]}`;
    }

    const paymentShipmentPattern = /Payment for shipment\s+([A-Za-z0-9-]+)/i;
    const paymentShipmentMatch = raw.match(paymentShipmentPattern);
    if (paymentShipmentMatch) {
      return isRTL
        ? `دفع مقابل الشحنة ${paymentShipmentMatch[1]}`
        : `Payment for shipment ${paymentShipmentMatch[1]}`;
    }

    const translated = raw
      .replace(
        /Withdrawal request/gi,
        isRTL ? "طلب سحب رصيد" : "Withdrawal request",
      )
      .replace(
        /Approved by platform admin/gi,
        isRTL ? "تمت الموافقة من مالك المنصة" : "Approved by platform admin",
      )
      .replace(
        /Rejected by platform admin/gi,
        isRTL ? "تم الرفض من مالك المنصة" : "Rejected by platform admin",
      )
      .replace(/Approved:/gi, isRTL ? "تمت الموافقة:" : "Approved:")
      .replace(/Rejected:/gi, isRTL ? "تم الرفض:" : "Rejected:")
      .replace(
        /Deposit to wallet/gi,
        isRTL ? "إيداع في المحفظة" : "Deposit to wallet",
      )
      .replace(
        /Paymera eGate deposit completed/gi,
        isRTL ? "اكتمل الإيداع عبر Paymera eGate" : "Paymera eGate deposit completed",
      )
      .replace(
        /Paymera eGate deposit pending/gi,
        isRTL ? "الإيداع عبر Paymera eGate قيد الانتظار" : "Paymera eGate deposit pending",
      )
      .replace(
        /Paymera eGate deposit failed/gi,
        isRTL ? "فشل الإيداع عبر Paymera eGate" : "Paymera eGate deposit failed",
      )
      .replace(
        /Transaction Id:/gi,
        isRTL ? "رقم المعاملة:" : "Transaction Id:",
      )
      .replace(
        /Transaction ID:/gi,
        isRTL ? "رقم المعاملة:" : "Transaction ID:",
      )
      .replace(
        /RRN:/gi,
        isRTL ? "RRN:" : "RRN:",
      );

    return translated;
  };

  const handleDownloadTransaction = async (transaction: Transaction) => {
    setDownloadingId(transaction.id);
    try {
        const fontLink = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap";
        const dir = isRTL ? "rtl" : "ltr";
        const logoSrc = "/logo.png";

        const fallbackLogo = '/uploads/company-logos/company-logo-1775549911206-358053182.jpg';
        const html = `
          <div lang="${language}" dir="${dir}" style="font-family: 'Tajawal', Arial, Helvetica, sans-serif; direction: ${dir}; padding:24px; background:#fff; color:#0f172a; width:800px; max-width:800px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="/logo.png" alt="Shipme" style="width:120px; height:auto; object-fit:contain;" />
              </div>
              <div style="text-align:${isRTL ? 'left' : 'right'}; font-size:12px; color:#64748b;">${new Date().toLocaleString()}</div>
            </div>
            <hr style="margin:0 0 20px 0; border:none; height:1px; background:#e6eef8;" />
            <h2 style="margin:0 0 22px 0; font-size:20px; font-weight:700;">${isRTL ? 'تفاصيل المعاملة' : 'Transaction Details'}</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start;">
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'النوع' : 'Type'}</div>
                <div style="margin-top:8px; font-weight:600; font-size:14px;">${getTypeLabel(transaction.type)}</div>
              </div>
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'المبلغ' : 'Amount'}</div>
                <div style="margin-top:8px; font-weight:800; color:#059669; font-size:14px;">${transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}${formatCurrency(transaction.amount, transaction.currency)}</div>
                <div style="font-size:12px; color:#64748b; margin-top:4px;">${getCurrencyLabel(transaction.currency)}</div>
              </div>
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'الحالة' : 'Status'}</div>
                <div style="margin-top:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; min-width:120px; height:44px; background:#0f172a; color:#fff; padding:0 18px; border-radius:9999px; font-size:12px; text-align:center; white-space:nowrap;">${getStatusLabelText(transaction.status)}</span>
                </div>
              </div>
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'الطريقة' : 'Method'}</div>
                <div style="margin-top:8px; font-weight:600; font-size:14px;">${getMethodLabel(transaction.method)}</div>
              </div>
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'التاريخ' : 'Date'}</div>
                <div style="margin-top:8px; font-size:14px;">${transaction.date}</div>
              </div>
              <div style="text-align:${isRTL ? 'right' : 'left'};">
                <div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'المرجع' : 'Reference'}</div>
                <div style="margin-top:8px; font-family:monospace; font-size:13px;">${transaction.reference || '-'}</div>
              </div>
            </div>
            ${transaction.notes ? `<div style="margin-top:24px; text-align:${isRTL ? 'right' : 'left'};"><div style="color:#64748b; font-size:12px; font-weight:700;">${isRTL ? 'ملاحظات' : 'Notes'}</div><div style="margin-top:8px; background:#f1f5f9; padding:14px 18px; border-radius:12px; min-height:64px; display:flex; align-items:center; text-align:${isRTL ? 'right' : 'left'};">${getNotesLabel(transaction.notes)}</div></div>` : ''}
          </div>
        `;

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.lang = language;
        container.dir = dir;
        container.innerHTML = `<link href="${fontLink}" rel="stylesheet">` + html;
        document.body.appendChild(container);

        await (document as any).fonts?.ready;

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = (pdf as any).getImageProperties(imgData);
        const imgWidth = pageWidth - 20; // 10mm margin
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 20;
        }

        pdf.save(`transaction-${transaction.id}.pdf`);
        document.body.removeChild(container);
        toast.success(isRTL ? 'تم تنزيل البوليصة' : 'Downloaded PDF');
    } catch (e: any) {
      toast.error(isRTL ? 'فشل تنزيل البوليصة' : 'Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintTransaction = (transaction: Transaction) => {
    try {
      const dir = isRTL ? "rtl" : "ltr";
      const fontLink = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap";
      const logoSrc = "/logo.png";
      const fallbackLogo = '/uploads/company-logos/company-logo-1775549911206-358053182.jpg';
      const html = `
        <html lang="${language}" dir="${dir}">
          <head>
            <meta charset="utf-8" />
            <title>${isRTL ? "تفاصيل المعاملة" : "Transaction Details"}</title>
            <link href="${fontLink}" rel="stylesheet">
            <style>
              body { font-family: 'Tajawal', Arial, Helvetica, sans-serif; padding:24px; direction:${dir}; color:#0f172a; }
              .wrapper { width:800px; max-width:800px; }
              .header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
              .title { margin:0 0 22px 0; font-size:20px; font-weight:700; }
              .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
              .field { text-align:${isRTL ? 'right' : 'left'}; }
              .field-label { color:#64748b; font-size:12px; font-weight:700; }
              .field-value { margin-top:8px; font-weight:600; font-size:14px; }
              .badge { display:inline-flex; align-items:center; justify-content:center; min-width:120px; height:44px; background:#0f172a; color:#fff; padding:0 18px; border-radius:9999px; font-size:12px; text-align:center; white-space:nowrap; }
              .notes-box { margin-top:8px; background:#f1f5f9; padding:14px 18px; border-radius:12px; min-height:64px; display:flex; align-items:center; text-align:${isRTL ? 'right' : 'left'}; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header">
                <div style="display:flex; align-items:center; gap:12px;">
                  <img src="/logo.png" alt="Shipme" style="width:140px; height:auto; object-fit:contain;" />
                </div>
                <div style="font-size:12px; color:#64748b; text-align:${isRTL ? 'left' : 'right'};">${new Date().toLocaleString()}</div>
              </div>
              <h2 class="title">${isRTL ? 'تفاصيل المعاملة' : 'Transaction Details'}</h2>
              <div class="grid">
                <div class="field">
                  <div class="field-label">${isRTL ? 'النوع' : 'Type'}</div>
                  <div class="field-value">${getTypeLabel(transaction.type)}</div>
                </div>
                <div class="field">
                  <div class="field-label">${isRTL ? 'المبلغ' : 'Amount'}</div>
                  <div class="field-value" style="color:#059669; font-weight:800;">${transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}${formatCurrency(transaction.amount, transaction.currency)}</div>
                  <div style="margin-top:4px; color:#64748b; font-size:12px;">${getCurrencyLabel(transaction.currency)}</div>
                </div>
                <div class="field">
                  <div class="field-label">${isRTL ? 'الحالة' : 'Status'}</div>
                  <div style="margin-top:8px; display:flex; flex-direction:column; align-items:${isRTL ? 'flex-end' : 'flex-start'};">
                    <span class="badge">${getStatusLabelText(transaction.status)}</span>
                  </div>
                </div>
                <div class="field">
                  <div class="field-label">${isRTL ? 'الطريقة' : 'Method'}</div>
                  <div class="field-value">${getMethodLabel(transaction.method)}</div>
                </div>
                <div class="field">
                  <div class="field-label">${isRTL ? 'التاريخ' : 'Date'}</div>
                  <div class="field-value">${transaction.date}</div>
                </div>
                <div class="field">
                  <div class="field-label">${isRTL ? 'المرجع' : 'Reference'}</div>
                  <div style="margin-top:8px; font-family:monospace; font-size:13px;">${transaction.reference || '-'}</div>
                </div>
              </div>
              ${transaction.notes ? `<div style="margin-top:24px; text-align:${isRTL ? 'right' : 'left'};"><div class="field-label">${isRTL ? 'ملاحظات' : 'Notes'}</div><div class="notes-box">${getNotesLabel(transaction.notes)}</div></div>` : ''}
            </div>
          </body>
        </html>
      `;

      const w = window.open("", "_blank");
      if (!w) {
        toast.error(isRTL ? "تعذر فتح نافذة الطباعة" : "Unable to open print window");
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (e: any) {
      toast.error(isRTL ? "فشل الطباعة" : "Failed to print");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterCurrency("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const blob = await walletService.exportTransactionsExcel({
        type: filterType,
        status: filterStatus,
        currency: filterCurrency,
        search: searchQuery,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        language,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        isRTL ? "تم تصدير ملف Excel بنجاح" : "Excel exported successfully",
      );
    } catch (error: any) {
      toast.error(
        error.message ||
          (isRTL ? "فشل تصدير ملف Excel" : "Failed to export Excel"),
      );
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const transactionId = String(
      searchParams.get("transactionId") || "",
    ).trim();
    if (!transactionId || !transactions.length) return;

    const matchedTransaction = transactions.find(
      (transaction) => transaction.id === transactionId,
    );
    if (!matchedTransaction) return;

    setSelectedTransaction(matchedTransaction);
    setIsTransactionDetailsOpen(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("transactionId");
    setSearchParams(nextParams, { replace: true });
  }, [transactions, searchParams, setSearchParams]);

  return (
    <div
      className={`container mx-auto p-3 sm:p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("financialTransactions.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("financialTransactions.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>{t("transactionHistory")}</CardTitle>
              <CardDescription>{t("recentTransactions")}</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <Badge variant="secondary" className="text-sm">
                {t("transactionsCount", {
                  filtered: filteredTransactions.length,
                  total: transactions.length,
                })}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting || isLoading}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {isRTL ? "تصدير Excel" : "Export Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchTransactionsPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("transactionType")}
                </Label>
                <Select
                  value={filterType}
                  onValueChange={(value: string) =>
                    setFilterType(value as TransactionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="deposit">{t("deposit")}</SelectItem>
                    <SelectItem value="withdrawal">
                      {t("withdrawal")}
                    </SelectItem>
                    <SelectItem value="payment">
                      {t("balance.payment")}
                    </SelectItem>
                    <SelectItem value="refund">{t("refund")}</SelectItem>
                    <SelectItem value="fee">{t("fee")}</SelectItem>
                    <SelectItem value="commission">
                      {t("commission")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("currency")}
                </Label>
                <Select
                  value={filterCurrency}
                  onValueChange={(value: string) =>
                    setFilterCurrency(value as FilterCurrency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="SYP">{t("syrianPound")}</SelectItem>
                    <SelectItem value="USD">{t("usDollar")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("status")}
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value: string) =>
                    setFilterStatus(value as TransactionStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="failed">{t("failed")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {isRTL ? "من تاريخ" : "From Date"}
                </Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {isRTL ? "إلى تاريخ" : "To Date"}
                </Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t("noMatchingTransactions")}</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "deposit" ||
                          transaction.type === "refund"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" ||
                        transaction.type === "refund" ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium break-words">
                          {getTypeLabel(transaction.type)}
                        </div>
                        <div className="text-sm text-muted-foreground break-words">
                          {getMethodLabel(transaction.method)} •{" "}
                          {transaction.date}
                        </div>
                        {transaction.reference && (
                          <div className="text-xs text-muted-foreground break-all">
                            {t("reference")}: {transaction.reference}
                          </div>
                        )}
                        {transaction.notes && (
                          <div className="text-xs text-muted-foreground break-words mt-1">
                            {t("notes")}: {getNotesLabel(transaction.notes)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <div
                          className={`font-semibold ${
                            transaction.type === "deposit" ||
                            transaction.type === "refund"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "deposit" ||
                          transaction.type === "refund"
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getCurrencyLabel(transaction.currency)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(transaction.status)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadTransaction(transaction)}
                          className="min-h-[40px] min-w-[40px]"
                          disabled={downloadingId === transaction.id}
                        >
                          {downloadingId === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintTransaction(transaction)}
                          className="min-h-[40px] min-w-[40px]"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsTransactionDetailsOpen(true);
                          }}
                          className="min-h-[40px] min-w-[40px]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isTransactionDetailsOpen}
        onOpenChange={setIsTransactionDetailsOpen}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("transactionDetails")}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("type")}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`p-1 rounded-full ${
                        selectedTransaction.type === "deposit" ||
                        selectedTransaction.type === "refund"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {selectedTransaction.type === "deposit" ||
                      selectedTransaction.type === "refund" ? (
                        <Plus className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </div>
                    {getTypeLabel(selectedTransaction.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("amount")}
                  </Label>
                  <div
                    className={`mt-1 font-semibold ${
                      selectedTransaction.type === "deposit" ||
                      selectedTransaction.type === "refund"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.type === "deposit" ||
                    selectedTransaction.type === "refund"
                      ? "+"
                      : "-"}
                    {formatCurrency(
                      selectedTransaction.amount,
                      selectedTransaction.currency,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getCurrencyLabel(selectedTransaction.currency)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("status")}
                  </Label>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(selectedTransaction.status)}
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("method")}
                  </Label>
                  <div className="mt-1">
                    {getMethodLabel(selectedTransaction.method)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("date")}
                  </Label>
                  <div className="mt-1">{selectedTransaction.date}</div>
                </div>
                {selectedTransaction.reference && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t("reference")}
                    </Label>
                    <div className="mt-1 font-mono text-sm">
                      {selectedTransaction.reference}
                    </div>
                  </div>
                )}
              </div>
              {selectedTransaction.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("notes")}
                  </Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {getNotesLabel(selectedTransaction.notes)}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => selectedTransaction && handleDownloadTransaction(selectedTransaction)}
                  className="flex-1"
                  disabled={downloadingId === selectedTransaction?.id}
                >
                  {downloadingId === selectedTransaction?.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isRTL ? "تحميل" : "Download"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectedTransaction && handlePrintTransaction(selectedTransaction)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isRTL ? "طباعة" : "Print"}
                </Button>
              </div>
              <Separator />
              <Button
                onClick={() => setIsTransactionDetailsOpen(false)}
                className="w-full"
              >
                {t("close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
