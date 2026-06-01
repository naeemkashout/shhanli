import React, { useEffect, useState } from "react";
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
import {
  Search,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WalletManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const isCompanyAdmin = user?.role === "company-admin";
  const [companyViewMode, setCompanyViewMode] = useState<
    "all" | "company-settlement"
  >("all");

  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    platformCollected: 0,
    codCollected: 0,
    deliveredAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isSettlementView =
    isCompanyAdmin && companyViewMode === "company-settlement";

  useEffect(() => {
    fetchRows();
  }, [
    page,
    search,
    typeFilter,
    statusFilter,
    paymentMethodFilter,
    currencyFilter,
    dateFrom,
    dateTo,
    isCompanyAdmin,
    companyViewMode,
  ]);

  const fetchRows = async () => {
    try {
      setIsLoading(true);

      const response = await adminService.getAllTransactions({
        type: isSettlementView ? undefined : typeFilter,
        status: isSettlementView ? undefined : statusFilter,
        scope: isCompanyAdmin ? companyViewMode : "all",
        search: search || undefined,
        shipmentStatus: isSettlementView ? statusFilter : undefined,
        paymentMethod: paymentMethodFilter || undefined,
        currency: currencyFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 15,
      });

      setRows(response.data || []);
      setSummary(
        response.summary || {
          totalAmount: 0,
          platformCollected: 0,
          codCollected: 0,
          deliveredAmount: 0,
        },
      );
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل المعاملات", "Failed to load transactions"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      deposit: "bg-green-100 text-green-800",
      withdrawal: "bg-red-100 text-red-800",
      payment: "bg-blue-100 text-blue-800",
      refund: "bg-purple-100 text-purple-800",
      fee: "bg-orange-100 text-orange-800",
      commission: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const typeOptions = [
    { value: "deposit", label: tr("إيداع", "Deposit") },
    { value: "withdrawal", label: tr("سحب", "Withdrawal") },
    { value: "payment", label: tr("دفع", "Payment") },
    { value: "refund", label: tr("استرداد", "Refund") },
    { value: "fee", label: tr("رسوم", "Fee") },
    { value: "commission", label: tr("عمولة", "Commission") },
  ];

  const shipmentStatusOptions = [
    { value: "pending", label: tr("معلقة", "Pending") },
    { value: "confirmed", label: tr("مؤكدة", "Confirmed") },
    { value: "picked-up", label: tr("تم الاستلام", "Picked Up") },
    { value: "in-transit", label: tr("قيد النقل", "In Transit") },
    {
      value: "out-for-delivery",
      label: tr("خارج للتسليم", "Out for Delivery"),
    },
    { value: "delivered", label: tr("تم التسليم", "Delivered") },
    { value: "cancelled", label: tr("ملغاة", "Cancelled") },
    { value: "returned", label: tr("مرتجعة", "Returned") },
  ];

  const statusOptions = [
    { value: "pending", label: tr("معلقة", "Pending") },
    { value: "completed", label: tr("مكتملة", "Completed") },
    { value: "failed", label: tr("فاشلة", "Failed") },
    { value: "cancelled", label: tr("ملغاة", "Cancelled") },
  ];

  const paymentMethodOptions = [
    { value: "wallet", label: tr("المحفظة", "Wallet") },
    { value: "cod", label: tr("الدفع عند الاستلام", "Cash on Delivery") },
  ];

  const currencyOptions = [
    { value: "SYP", label: tr("الليرة السورية (SYP)", "Syrian Pound (SYP)") },
    { value: "USD", label: tr("الدولار الأمريكي (USD)", "US Dollar (USD)") },
  ];

  const handleExportExcel = async () => {
    try {
      const blob = isSettlementView
        ? await adminService.exportCompanySettlementExcel({
            companyId: String(user?.shippingCompanyId || "") || undefined,
            search,
            shipmentStatus: statusFilter,
            paymentMethod: paymentMethodFilter,
            currency: currencyFilter,
            dateFrom,
            dateTo,
            language: language === "ar" ? "ar" : "en",
          })
        : await adminService.exportTransactionsExcel({
            transactionType: typeFilter || undefined,
            status: statusFilter || undefined,
            scope: isCompanyAdmin ? companyViewMode : "all",
            search: search || undefined,
            paymentMethod: paymentMethodFilter || undefined,
            currency: currencyFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            language: language === "ar" ? "ar" : "en",
          });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isSettlementView
        ? `company-settlement-${Date.now()}.xlsx`
        : `transactions-${Date.now()}.xlsx`;
      a.click();
      toast.success(
        tr("تم تصدير ملف Excel بنجاح", "Excel exported successfully"),
      );
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تصدير ملف Excel", "Failed to export Excel"),
      );
    }
  };

  const formatAmount = (value: number) =>
    Number(value || 0).toLocaleString(language === "ar" ? "ar-SY" : "en-US");

  const getTypeLabel = (type: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      deposit: { ar: "إيداع", en: "Deposit" },
      withdrawal: { ar: "سحب", en: "Withdrawal" },
      payment: { ar: "دفع", en: "Payment" },
      refund: { ar: "استرداد", en: "Refund" },
      fee: { ar: "رسوم", en: "Fee" },
      commission: { ar: "عمولة", en: "Commission" },
    };

    return map[type] ? (language === "ar" ? map[type].ar : map[type].en) : type;
  };

  const getStatusLabel = (status: string) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    const map: Record<string, { ar: string; en: string }> = {
      pending: { ar: "معلقة", en: "Pending" },
      completed: { ar: "مكتملة", en: "Completed" },
      failed: { ar: "فاشلة", en: "Failed" },
      cancelled: { ar: "ملغاة", en: "Cancelled" },
      approved: { ar: "مقبولة", en: "Approved" },
      rejected: { ar: "مرفوضة", en: "Rejected" },
      "not-required": { ar: "غير مطلوب", en: "Not Required" },
      deducted: { ar: "تم الخصم", en: "Deducted" },
      "insufficient-cancelled": {
        ar: "ملغاة بسبب عدم كفاية الرصيد",
        en: "Cancelled - Insufficient Balance",
      },
    };

    return map[normalized]
      ? language === "ar"
        ? map[normalized].ar
        : map[normalized].en
      : status;
  };

  const getShipmentStatusLabel = (status: string) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    const map: Record<string, { ar: string; en: string }> = {
      pending: { ar: "معلقة", en: "Pending" },
      confirmed: { ar: "مؤكدة", en: "Confirmed" },
      "picked-up": { ar: "تم الاستلام", en: "Picked Up" },
      "in-transit": { ar: "قيد النقل", en: "In Transit" },
      "out-for-delivery": { ar: "خارج للتسليم", en: "Out for Delivery" },
      delivered: { ar: "تم التسليم", en: "Delivered" },
      cancelled: { ar: "ملغاة", en: "Cancelled" },
      returned: { ar: "مرتجعة", en: "Returned" },
    };

    return map[normalized]
      ? language === "ar"
        ? map[normalized].ar
        : map[normalized].en
      : status;
  };

  const getMethodLabel = (method: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      wallet: { ar: "المحفظة", en: "Wallet" },
      cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
      cash: { ar: "نقدي", en: "Cash" },
      card: { ar: "بطاقة", en: "Card" },
      "bank-transfer": { ar: "تحويل بنكي", en: "Bank Transfer" },
      "mobile-payment": { ar: "محفظة إلكترونية", en: "Mobile Wallet" },
    };

    return map[method]
      ? language === "ar"
        ? map[method].ar
        : map[method].en
      : method;
  };

  const getDescriptionLabel = (description: string) => {
    const raw = String(description || "").trim();
    if (!raw) return "-";

    if (language !== "ar") return raw;

    const refundCancelledShipmentPattern =
      /Refund for cancelled shipment\s+([A-Za-z0-9-]+)/i;
    const refundCancelledShipmentMatch = raw.match(
      refundCancelledShipmentPattern,
    );
    if (refundCancelledShipmentMatch) {
      return `استرداد لشحنة ملغاة ${refundCancelledShipmentMatch[1]}`;
    }

    const paymentShipmentPattern = /Payment for shipment\s+([A-Za-z0-9-]+)/i;
    const paymentShipmentMatch = raw.match(paymentShipmentPattern);
    if (paymentShipmentMatch) {
      return `دفع مقابل الشحنة ${paymentShipmentMatch[1]}`;
    }

    return raw
      .replace(/Withdrawal request/gi, "طلب سحب رصيد")
      .replace(/Approved by platform admin/gi, "تمت الموافقة من مالك المنصة")
      .replace(/Rejected by platform admin/gi, "تم الرفض من مالك المنصة")
      .replace(/Approved:/gi, "تمت الموافقة:")
      .replace(/Rejected:/gi, "تم الرفض:")
      .replace(/Deposit to wallet/gi, "إيداع في المحفظة");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        {isCompanyAdmin
          ? isSettlementView
            ? tr(
                "المعاملات المالية (حساب الشحنات بين شركة الشحن ومالك المنصة)",
                "Financial Transactions (Settlement Between Company and Platform Owner)",
              )
            : tr("جميع المعاملات المالية", "All Financial Transactions")
          : tr(
              "إدارة المحفظة والمعاملات",
              "Wallet and Transactions Management",
            )}
      </h1>

      {isCompanyAdmin && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-600">
                {tr("نوع العرض:", "View Mode:")}
              </span>
              <select
                value={companyViewMode}
                onChange={(e) => {
                  setPage(1);
                  setCompanyViewMode(
                    e.target.value as "all" | "company-settlement",
                  );
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">
                  {tr("جميع المعاملات المالية", "All Financial Transactions")}
                </option>
                <option value="company-settlement">
                  {tr(
                    "حساب الشحنات بين شركة الشحن ومالك المنصة",
                    "Shipment Settlement Between Company and Platform Owner",
                  )}
                </option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {isSettlementView && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">
                {tr("إجمالي قيمة الشحنات", "Total Shipment Value")}
              </p>
              <p className="text-xl font-bold">
                {formatAmount(summary.totalAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">
                {tr(
                  "محصل عبر المنصة (المحفظة)",
                  "Collected via Platform (Wallet)",
                )}
              </p>
              <p className="text-xl font-bold text-blue-700">
                {formatAmount(summary.platformCollected)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">
                {tr(
                  "محصل عند التسليم (الدفع عند الاستلام)",
                  "Collected on Delivery (COD)",
                )}
              </p>
              <p className="text-xl font-bold text-green-700">
                {formatAmount(summary.codCollected)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">
                {tr("قيمة الشحنات المسلمة", "Delivered Shipments Value")}
              </p>
              <p className="text-xl font-bold text-purple-700">
                {formatAmount(summary.deliveredAmount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            {isSettlementView ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tr(
                      "بحث برقم التتبع أو اسم المرسل/المستلم",
                      "Search by tracking number or sender/receiver name",
                    )}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">
                      {tr("كل حالات الشحنات", "All Shipment Statuses")}
                    </option>
                    {shipmentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">
                      {tr("كل طرق الدفع", "All Payment Methods")}
                    </option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">
                      {tr("كل العملات", "All Currencies")}
                    </option>
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tr(
                    "بحث بالمرجع أو الوصف",
                    "Search by reference or description",
                  )}
                  className="w-full sm:w-72"
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr("جميع الأنواع", "All Types")}</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {tr("جميع طرق الدفع", "All Payment Methods")}
                  </option>
                  <option value="wallet">{tr("المحفظة", "Wallet")}</option>
                  <option value="cash">{tr("نقدي", "Cash")}</option>
                  <option value="card">{tr("بطاقة", "Card")}</option>
                  <option value="bank-transfer">
                    {tr("تحويل بنكي", "Bank Transfer")}
                  </option>
                  <option value="mobile-payment">
                    {tr("محفظة إلكترونية", "Mobile Wallet")}
                  </option>
                </select>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr("كل العملات", "All Currencies")}</option>
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr("جميع الحالات", "All Statuses")}</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchRows}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {tr("تحديث", "Refresh")}
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  {tr("تصدير Excel", "Export Excel")}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr("المرجع", "Reference")}</TableHead>
                      {isSettlementView ? (
                        <>
                          <TableHead>
                            {tr("رقم الشحنة", "Tracking Number")}
                          </TableHead>
                          <TableHead>{tr("العميل", "Customer")}</TableHead>
                          <TableHead>
                            {tr("حالة الشحنة", "Shipment Status")}
                          </TableHead>
                          <TableHead>
                            {tr("طريقة الدفع", "Payment Method")}
                          </TableHead>
                          <TableHead>{tr("المبلغ", "Amount")}</TableHead>
                          <TableHead>{tr("التاريخ", "Date")}</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>{tr("المستخدم", "User")}</TableHead>
                          <TableHead>{tr("النوع", "Type")}</TableHead>
                          <TableHead>{tr("المبلغ", "Amount")}</TableHead>
                          <TableHead>{tr("الطريقة", "Method")}</TableHead>
                          <TableHead>{tr("الحالة", "Status")}</TableHead>
                          <TableHead>{tr("الوصف", "Description")}</TableHead>
                          <TableHead>{tr("التاريخ", "Date")}</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row._id} className="align-top">
                        <TableCell className="font-mono text-sm break-words">
                          {row.reference}
                        </TableCell>
                        {isSettlementView ? (
                          <>
                            <TableCell className="font-medium break-words">
                              {row.trackingNumber}
                            </TableCell>
                            <TableCell className="break-words">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {row.customer?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {row.customer?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getShipmentStatusLabel(row.shipmentStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getMethodLabel(row.paymentMethod)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(row.amount)} {row.currency}
                            </TableCell>
                            <TableCell>
                              {new Date(row.createdAt).toLocaleString(
                                language === "ar" ? "ar-SY" : "en-US",
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="break-words">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {row.userId?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {row.userId?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getTypeColor(row.type)}>
                                {row.type === "deposit" ||
                                row.type === "refund" ? (
                                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                )}
                                <span>{getTypeLabel(row.type)}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {row.amount} {row.currency}
                            </TableCell>
                            <TableCell>{getMethodLabel(row.method)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  row.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {getStatusLabel(row.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="break-words">
                              {getDescriptionLabel(row.description)}
                            </TableCell>
                            <TableCell>
                              {new Date(row.createdAt).toLocaleString(
                                language === "ar" ? "ar-SY" : "en-US",
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
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
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    {tr("السابق", "Previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
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
