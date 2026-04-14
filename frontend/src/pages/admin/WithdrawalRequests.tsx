import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";

export default function WithdrawalRequests() {
  const language = (localStorage.getItem("language") as "ar" | "en") || "ar";
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingId, setIsSubmittingId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRows();
  }, [search, statusFilter, currencyFilter, dateFrom, dateTo, page]);

  const fetchRows = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllTransactions({
        type: "withdrawal",
        status: statusFilter || undefined,
        search: search || undefined,
        currency: currencyFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 15,
      });

      setRows(response?.data || []);
      setTotalPages(response?.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل طلبات السحب", "Failed to load withdrawal requests"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    const labelMap: Record<string, string> = {
      pending: tr("معلقة", "Pending"),
      completed: tr("مكتملة", "Completed"),
      failed: tr("فاشلة", "Failed"),
      cancelled: tr("ملغاة", "Cancelled"),
    };

    return (
      <Badge className={map[status] || "bg-gray-100 text-gray-800"}>
        {labelMap[status] || status}
      </Badge>
    );
  };

  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      wallet: tr("المحفظة", "Wallet"),
      cash: tr("نقدي", "Cash"),
      card: tr("بطاقة", "Card"),
      "bank-transfer": tr("تحويل بنكي", "Bank Transfer"),
      "mobile-payment": tr("محفظة إلكترونية", "Mobile Wallet"),
    };

    return methodMap[method] || method || "-";
  };

  const getDescriptionLabel = (description: string) => {
    const raw = String(description || "").trim();
    if (!raw) return "-";

    if (raw === "Withdrawal request")
      return tr("طلب سحب رصيد", "Withdrawal request");

    return raw
      .replace(
        "Approved by platform admin",
        tr("تمت الموافقة من مالك المنصة", "Approved by platform admin"),
      )
      .replace(
        "Rejected by platform admin",
        tr("تم الرفض من مالك المنصة", "Rejected by platform admin"),
      )
      .replace("Approved:", tr("تمت الموافقة:", "Approved:"))
      .replace("Rejected:", tr("تم الرفض:", "Rejected:"));
  };

  const handleReviewRequest = async (
    transactionId: string,
    action: "approve" | "reject",
  ) => {
    try {
      setIsSubmittingId(transactionId);
      await adminService.reviewWithdrawalRequest(transactionId, { action });
      toast.success(
        action === "approve"
          ? tr("تم قبول طلب السحب", "Withdrawal request approved")
          : tr("تم رفض طلب السحب", "Withdrawal request rejected"),
      );
      await fetchRows();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr(
            "فشل تحديث حالة طلب السحب",
            "Failed to update withdrawal request status",
          ),
      );
    } finally {
      setIsSubmittingId("");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">طلبات سحب الرصيد</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="بحث بالمرجع أو الوصف"
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">كل الحالات</option>
                <option value="pending">معلقة</option>
                <option value="completed">مكتملة</option>
                <option value="failed">فاشلة</option>
                <option value="cancelled">ملغاة</option>
              </select>

              <select
                value={currencyFilter}
                onChange={(e) => {
                  setPage(1);
                  setCurrencyFilter(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">كل العملات</option>
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
              <Button variant="outline" onClick={fetchRows}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد طلبات سحب</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المرجع</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>العملة</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">
                        {row.reference || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{row.userId?.name || "-"}</div>
                          <div className="text-gray-500">
                            {row.userId?.email || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Number(row.amount || 0).toLocaleString("ar-SY")}
                      </TableCell>
                      <TableCell>{row.currency || "-"}</TableCell>
                      <TableCell>{getMethodLabel(row.method)}</TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {getDescriptionLabel(row.description)}
                      </TableCell>
                      <TableCell>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString("ar-SY")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleReviewRequest(row._id, "approve")
                              }
                              disabled={isSubmittingId === row._id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReviewRequest(row._id, "reject")
                              }
                              disabled={isSubmittingId === row._id}
                            >
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  السابق
                </Button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  التالي
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
