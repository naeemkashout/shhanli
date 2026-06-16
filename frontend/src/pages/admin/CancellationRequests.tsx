import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/adminService";
import { useLanguage } from "@/contexts/LanguageContext";

const statusOptions = ["all", "pending", "approved", "rejected"] as const;

export default function CancellationRequests() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>("pending");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReason, setSelectedReason] = useState<{
    trackingNumber: string;
    reason: string;
  } | null>(null);
  const [pendingReview, setPendingReview] = useState<{
    shipmentId: string;
    trackingNumber: string;
    action: "approve" | "reject";
  } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [search, statusFilter, companyId, page]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await adminService.getAllCompanies({ page: 1, limit: 1000 });
        setCompanies(response.data || []);
      } catch {
        setCompanies([]);
      }
    };

    loadCompanies();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getCancellationRequests({
        search,
        status: statusFilter,
        companyId,
        page,
        limit: 10,
      });
      setRequests(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل طلبات الإلغاء", "Failed to load cancellation requests"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (
    shipmentId: string,
    action: "approve" | "reject",
  ) => {
    try {
      await adminService.reviewCancellationRequest(shipmentId, { action });
      toast.success(
        action === "approve"
          ? tr("تمت الموافقة على طلب الإلغاء", "Cancellation request approved")
          : tr("تم رفض طلب الإلغاء", "Cancellation request rejected"),
      );
      fetchRequests();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr(
            "فشل معالجة طلب الإلغاء",
            "Failed to process cancellation request",
          ),
      );
    }
  };

  const handleConfirmReview = async () => {
    if (!pendingReview) return;

    await handleReview(pendingReview.shipmentId, pendingReview.action);
    setPendingReview(null);
  };

  const getCancellationStatusBadge = (status?: string) => {
    if (status === "pending") {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          {tr("قيد المراجعة", "Under review")}
        </Badge>
      );
    }
    if (status === "approved") {
      return (
        <Badge className="bg-green-100 text-green-800">
          {tr("مقبول", "Approved")}
        </Badge>
      );
    }
    if (status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800">
          {tr("مرفوض", "Rejected")}
        </Badge>
      );
    }
    return <Badge className="bg-gray-100 text-gray-800">-</Badge>;
  };

  const getReasonPreview = (reason?: string) => {
    const normalizedReason = String(reason || "").trim();
    if (!normalizedReason) return "-";
    if (normalizedReason.length <= 90) return normalizedReason;
    return `${normalizedReason.slice(0, 90)}...`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          طلبات إلغاء الشحنات
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="البحث برقم التتبع، اسم المرسل أو المستلم..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={companyId}
              onChange={(e) => {
                setPage(1);
                setCompanyId(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{tr("كل الشركات", "All companies")}</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(
                  e.target.value as (typeof statusOptions)[number],
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? tr("الكل", "All")
                    : option === "pending"
                      ? tr("قيد المراجعة", "Under review")
                      : option === "approved"
                        ? tr("مقبول", "Approved")
                        : tr("مرفوض", "Rejected")}
                </option>
              ))}
            </select>
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
                      <TableHead>رقم التتبع</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>من</TableHead>
                      <TableHead>إلى</TableHead>
                      <TableHead>الشركة</TableHead>
                      <TableHead>سبب الإلغاء</TableHead>
                      <TableHead>حالة الطلب</TableHead>
                      <TableHead>تاريخ الطلب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-gray-500 py-6"
                        >
                          لا توجد طلبات إلغاء حالياً
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((shipment) => (
                        <TableRow key={shipment._id} className="align-top">
                          <TableCell className="font-medium break-words">
                            {shipment.trackingNumber}
                          </TableCell>
                          <TableCell className="break-words">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {shipment.userId?.name || "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {shipment.userId?.email || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm break-words">
                            {shipment.sender?.city || "-"},{" "}
                            {shipment.sender?.country || "-"}
                          </TableCell>
                          <TableCell className="text-sm break-words">
                            {shipment.receivers?.[0]?.city || "-"},{" "}
                            {shipment.receivers?.[0]?.country || "-"}
                          </TableCell>
                          <TableCell className="break-words">
                            {shipment.cancellationRequest?.reason ? (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                  {getReasonPreview(
                                    shipment.cancellationRequest.reason,
                                  )}
                                </p>
                                {String(
                                  shipment.cancellationRequest.reason,
                                ).trim().length > 90 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-auto p-0 text-blue-700 hover:text-blue-900"
                                    onClick={() =>
                                      setSelectedReason({
                                        trackingNumber: shipment.trackingNumber,
                                        reason:
                                          shipment.cancellationRequest.reason,
                                      })
                                    }
                                  >
                                    عرض كامل
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getCancellationStatusBadge(
                              shipment.cancellationRequest?.status,
                            )}
                          </TableCell>
                          <TableCell className="text-sm break-words">
                            {shipment.shippingCompany?.name || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {shipment.cancellationRequest?.requestedAt
                              ? new Date(
                                  shipment.cancellationRequest.requestedAt,
                                ).toLocaleDateString("ar-SY")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {shipment.cancellationRequest?.status ===
                            "pending" ? (
                              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-700 border-green-300"
                                  onClick={() =>
                                    setPendingReview({
                                      shipmentId: shipment._id,
                                      trackingNumber: shipment.trackingNumber,
                                      action: "approve",
                                    })
                                  }
                                >
                                  قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-700 border-red-300"
                                  onClick={() =>
                                    setPendingReview({
                                      shipmentId: shipment._id,
                                      trackingNumber: shipment.trackingNumber,
                                      action: "reject",
                                    })
                                  }
                                >
                                  رفض
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedReason)}
        onOpenChange={(open) => !open && setSelectedReason(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              سبب إلغاء الشحنة{" "}
              {selectedReason?.trackingNumber
                ? `(${selectedReason.trackingNumber})`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-slate-800">
              {selectedReason?.reason || "-"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingReview)}
        onOpenChange={(open) => !open && setPendingReview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingReview?.action === "approve"
                ? "تأكيد قبول طلب الإلغاء"
                : "تأكيد رفض طلب الإلغاء"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {pendingReview?.action === "approve"
                ? `هل أنت متأكد من قبول طلب إلغاء الشحنة ${pendingReview?.trackingNumber || ""}؟`
                : `هل أنت متأكد من رفض طلب إلغاء الشحنة ${pendingReview?.trackingNumber || ""}؟`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingReview(null)}>
                إلغاء
              </Button>
              <Button
                className={
                  pendingReview?.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
                onClick={handleConfirmReview}
              >
                {pendingReview?.action === "approve"
                  ? "تأكيد القبول"
                  : "تأكيد الرفض"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
