import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { normalizeLocalApiUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/adminService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

const statusOptions = ["all", "pending", "approved", "rejected"] as const;

export default function EditRequests() {
  const { language, t } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>("pending");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedText, setSelectedText] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [reviewUpdatesForm, setReviewUpdatesForm] = useState({
    shippingType: "",
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
  });

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

  useEffect(() => {
    const role = String(user?.role || "").trim();
    const isPlatformAdmin = role === "admin" || role === "super-admin";
    const companyId = String(
      (typeof user?.shippingCompanyId === "string"
        ? user?.shippingCompanyId
        : user?.shippingCompanyId?._id) || "",
    ).trim();

    if (!isPlatformAdmin && role !== "company-admin") return;
    if (role === "company-admin" && !companyId) return;

    const apiBaseUrl = normalizeLocalApiUrl(
      import.meta.env.VITE_API_URL || "http://localhost:5001/api",
    );
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      if (isPlatformAdmin) {
        socket.emit("join-admin");
      } else {
        socket.emit("join-company-room", companyId);
      }
    });

    socket.on("edit-request-created", (payload: any) => {
      toast.info(
        tr(
          `تم استلام طلب تعديل جديد للشحنة ${payload?.trackingNumber || ""}`,
          `New edit request received for shipment ${payload?.trackingNumber || ""}`,
        ),
      );
      fetchRequests();
    });

    socket.on("edit-request-reviewed", (payload: any) => {
      toast.info(
        payload?.action === "approve"
          ? tr(
              `تمت الموافقة على طلب تعديل الشحنة ${payload?.trackingNumber || ""}`,
              `Edit request approved for shipment ${payload?.trackingNumber || ""}`,
            )
          : tr(
              `تم رفض طلب تعديل الشحنة ${payload?.trackingNumber || ""}`,
              `Edit request rejected for shipment ${payload?.trackingNumber || ""}`,
            ),
      );
      fetchRequests();
    });

    return () => {
      socket.disconnect();
    };
  }, [
    user?.role,
    user?.shippingCompanyId,
    language,
    search,
    statusFilter,
    page,
  ]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getEditRequests({
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
          tr("فشل تحميل طلبات التعديل", "Failed to load edit requests"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewDialog = (shipment: any) => {
    setSelectedRequest(shipment);
    setReviewUpdatesForm({
      shippingType: String(shipment?.shippingType || ""),
      senderName: String(shipment?.sender?.name || ""),
      senderPhone: String(shipment?.sender?.phone || ""),
      senderEmail: String(shipment?.sender?.email || ""),
      senderCity: String(shipment?.sender?.city || ""),
      senderState: String(shipment?.sender?.state || ""),
      senderCountry: String(shipment?.sender?.country || ""),
      senderStreet: String(shipment?.sender?.street || ""),
      receiverName: String(shipment?.receivers?.[0]?.name || ""),
      receiverPhone: String(shipment?.receivers?.[0]?.phone || ""),
      receiverEmail: String(shipment?.receivers?.[0]?.email || ""),
      receiverCity: String(shipment?.receivers?.[0]?.city || ""),
      receiverState: String(shipment?.receivers?.[0]?.state || ""),
      receiverCountry: String(shipment?.receivers?.[0]?.country || ""),
      receiverStreet: String(shipment?.receivers?.[0]?.street || ""),
      packageType: String(shipment?.package?.type || ""),
      packageDescription: String(shipment?.package?.description || ""),
      packageWeight: String(shipment?.package?.weight ?? ""),
      packageLength: String(shipment?.package?.length ?? ""),
      packageWidth: String(shipment?.package?.width ?? ""),
      packageHeight: String(shipment?.package?.height ?? ""),
      packageValue: String(shipment?.package?.value ?? ""),
      packageCurrency: String(shipment?.package?.currency || ""),
      packageFragile: String(shipment?.package?.fragile ? "true" : "false"),
      packagePackagingRequested: String(
        shipment?.package?.packagingRequested ? "true" : "false",
      ),
    });
  };

  const submitReview = async (action: "approve" | "reject") => {
    if (!selectedRequest?._id) return;

    if (selectedRequest?.editRequest?.status !== "pending") {
      toast.error(
        tr(
          "تمت مراجعة هذا الطلب مسبقًا ولا يمكن اعتماده مرة أخرى",
          "This request has already been reviewed and cannot be processed again",
        ),
      );
      return;
    }

    let shipmentUpdates: Record<string, any> | undefined;

    if (action === "approve") {
      const parseOptionalNumber = (
        value: string,
        labelAr: string,
        labelEn: string,
        options?: { min?: number },
      ) => {
        const normalized = String(value || "").trim();
        if (!normalized) return undefined;

        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) {
          toast.error(
            tr(`قيمة ${labelAr} غير صالحة`, `Invalid ${labelEn} value`),
          );
          return null;
        }

        if (typeof options?.min === "number" && parsed < options.min) {
          toast.error(
            tr(
              `${labelAr} يجب أن يكون أكبر أو يساوي ${options.min}`,
              `${labelEn} must be greater than or equal to ${options.min}`,
            ),
          );
          return null;
        }

        return parsed;
      };

      const weightValue = parseOptionalNumber(
        reviewUpdatesForm.packageWeight,
        "وزن الطرد",
        "package weight",
        { min: 0.1 },
      );
      if (weightValue === null) return;

      const packageValue = parseOptionalNumber(
        reviewUpdatesForm.packageValue,
        "قيمة الطرد",
        "package value",
        { min: 0 },
      );
      if (packageValue === null) return;

      const keepOrTrim = (value: unknown, fallback: unknown) => {
        const normalized = String(value ?? "").trim();
        return normalized || fallback;
      };

      const baseSender = selectedRequest?.sender || {};
      const baseReceiver = selectedRequest?.receivers?.[0] || {};
      const basePackage = selectedRequest?.package || {};

      const sender: Record<string, any> = {
        ...baseSender,
        name: keepOrTrim(reviewUpdatesForm.senderName, baseSender.name),
        phone: keepOrTrim(reviewUpdatesForm.senderPhone, baseSender.phone),
        email: keepOrTrim(reviewUpdatesForm.senderEmail, baseSender.email),
        city: keepOrTrim(reviewUpdatesForm.senderCity, baseSender.city),
        state: keepOrTrim(reviewUpdatesForm.senderState, baseSender.state),
        country: keepOrTrim(reviewUpdatesForm.senderCountry, baseSender.country),
        street: keepOrTrim(reviewUpdatesForm.senderStreet, baseSender.street),
      };

      const receiver: Record<string, any> = {
        ...baseReceiver,
        name: keepOrTrim(reviewUpdatesForm.receiverName, baseReceiver.name),
        phone: keepOrTrim(reviewUpdatesForm.receiverPhone, baseReceiver.phone),
        email: keepOrTrim(reviewUpdatesForm.receiverEmail, baseReceiver.email),
        city: keepOrTrim(reviewUpdatesForm.receiverCity, baseReceiver.city),
        state: keepOrTrim(reviewUpdatesForm.receiverState, baseReceiver.state),
        country: keepOrTrim(reviewUpdatesForm.receiverCountry, baseReceiver.country),
        street: keepOrTrim(
          reviewUpdatesForm.receiverStreet,
          baseReceiver.street,
        ),
      };

      const pkg: Record<string, any> = {
        ...basePackage,
        type:
          reviewUpdatesForm.packageType || basePackage.type || "documents",
        description: keepOrTrim(
          reviewUpdatesForm.packageDescription,
          basePackage.description,
        ),
        weight:
          weightValue !== undefined
            ? weightValue
            : Number(basePackage.weight ?? 0),
        length:
          reviewUpdatesForm.packageLength.trim() !== ""
            ? Number(reviewUpdatesForm.packageLength)
            : Number(basePackage.length ?? 0),
        width:
          reviewUpdatesForm.packageWidth.trim() !== ""
            ? Number(reviewUpdatesForm.packageWidth)
            : Number(basePackage.width ?? 0),
        height:
          reviewUpdatesForm.packageHeight.trim() !== ""
            ? Number(reviewUpdatesForm.packageHeight)
            : Number(basePackage.height ?? 0),
        value:
          packageValue !== undefined
            ? packageValue
            : Number(basePackage.value ?? 0),
        currency:
          reviewUpdatesForm.packageCurrency || basePackage.currency || "USD",
        fragile:
          reviewUpdatesForm.packageFragile === "true"
            ? true
            : reviewUpdatesForm.packageFragile === "false"
            ? false
            : Boolean(basePackage.fragile),
        packagingRequested:
          reviewUpdatesForm.packagePackagingRequested === "true"
            ? true
            : reviewUpdatesForm.packagePackagingRequested === "false"
            ? false
            : Boolean(basePackage.packagingRequested),
      };

      const updates: Record<string, any> = {};
      updates.shippingType = reviewUpdatesForm.shippingType || selectedRequest?.shippingType;
      updates.sender = sender;
      updates.receivers = [receiver];
      updates.package = pkg;

      shipmentUpdates = Object.keys(updates).length > 0 ? updates : undefined;
    }

    try {
      const response = await adminService.reviewEditRequest(
        selectedRequest._id,
        {
          action,
          shipmentUpdates,
        },
      );

      const updatedCount = Array.isArray(response?.appliedUpdateFields)
        ? response.appliedUpdateFields.length
        : 0;

      toast.success(
        action === "approve"
          ? updatedCount > 0
            ? tr(
                `تمت الموافقة وتطبيق ${updatedCount} حقل(حقول) على الشحنة`,
                `Approved and applied ${updatedCount} field(s) on shipment`,
              )
            : tr("تمت الموافقة على طلب التعديل", "Edit request approved")
          : tr("تم رفض طلب التعديل", "Edit request rejected"),
      );

      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل معالجة طلب التعديل", "Failed to process edit request"),
      );
    }
  };

  const getStatusBadge = (status?: string) => {
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

  const getPreview = (text?: string) => {
    const normalized = String(text || "").trim();
    if (!normalized) return "-";
    if (normalized.length <= 90) return normalized;
    return `${normalized.slice(0, 90)}...`;
  };

  const isSelectedRequestPending =
    selectedRequest?.editRequest?.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          طلبات تعديل الشحنات
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
                      <TableHead>الشركة</TableHead>
                      <TableHead>سبب الطلب</TableHead>
                      <TableHead>التعديلات المطلوبة</TableHead>
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
                          لا توجد طلبات تعديل حالياً
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
                            {shipment.shippingCompany?.name || "-"}
                          </TableCell>
                          <TableCell className="break-words">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {getPreview(shipment.editRequest?.reason)}
                              </p>
                              {String(shipment.editRequest?.reason || "").trim()
                                .length > 90 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-auto p-0 text-blue-700 hover:text-blue-900"
                                  onClick={() =>
                                    setSelectedText({
                                      title: `سبب طلب التعديل (${shipment.trackingNumber})`,
                                      text: shipment.editRequest?.reason || "",
                                    })
                                  }
                                >
                                  عرض كامل
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="break-words">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {getPreview(
                                  shipment.editRequest?.requestedChanges,
                                )}
                              </p>
                              {String(
                                shipment.editRequest?.requestedChanges || "",
                              ).trim().length > 90 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-auto p-0 text-blue-700 hover:text-blue-900"
                                  onClick={() =>
                                    setSelectedText({
                                      title: `التعديلات المطلوبة (${shipment.trackingNumber})`,
                                      text:
                                        shipment.editRequest
                                          ?.requestedChanges || "",
                                    })
                                  }
                                >
                                  عرض كامل
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(shipment.editRequest?.status)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {shipment.editRequest?.requestedAt
                              ? new Date(
                                  shipment.editRequest.requestedAt,
                                ).toLocaleDateString("ar-SY")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog(shipment)}
                            >
                              عرض
                            </Button>
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
        open={Boolean(selectedText)}
        onOpenChange={(open) => !open && setSelectedText(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedText?.title || ""}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-slate-800">
              {selectedText?.text || "-"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tr("تفاصيل طلب التعديل", "Edit request details")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-3 text-sm space-y-2">
              <p>
                <span className="font-medium">
                  {tr("رقم التتبع", "Tracking")}:{" "}
                </span>
                {selectedRequest?.trackingNumber || "-"}
              </p>
              <p>
                <span className="font-medium">{tr("السبب", "Reason")}: </span>
                {selectedRequest?.editRequest?.reason || "-"}
              </p>
              <p>
                <span className="font-medium">
                  {tr("التعديلات المطلوبة", "Requested changes")}:
                </span>
                {selectedRequest?.editRequest?.requestedChanges || "-"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-4">
              <p className="font-semibold text-slate-900">
                {tr("تفاصيل الشحنة الحالية", "Current shipment details")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("الشركة", "Company")}</p>
                  <p>{selectedRequest?.shippingCompany?.name || "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("طريقة الدفع", "Payment method")}</p>
                  <p>{selectedRequest?.cost?.paymentMethod || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("بيانات المرسل", "Sender details")}</p>
                  <p>{selectedRequest?.sender?.name || "-"}</p>
                  <p>{selectedRequest?.sender?.phone || "-"}</p>
                  <p>{selectedRequest?.sender?.email || "-"}</p>
                  <p>{selectedRequest?.sender?.street || selectedRequest?.sender?.address || "-"}</p>
                  <p>
                    {selectedRequest?.sender?.city || "-"} - {selectedRequest?.sender?.country || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("بيانات المستلم", "Receiver details")}</p>
                  <p>{selectedRequest?.receivers?.[0]?.name || "-"}</p>
                  <p>{selectedRequest?.receivers?.[0]?.phone || "-"}</p>
                  <p>{selectedRequest?.receivers?.[0]?.email || "-"}</p>
                  <p>{selectedRequest?.receivers?.[0]?.street || selectedRequest?.receivers?.[0]?.address || "-"}</p>
                  <p>
                    {selectedRequest?.receivers?.[0]?.city || "-"} - {selectedRequest?.receivers?.[0]?.country || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">{tr("نوع الطرد", "Package type")}</p>
                  <p>{selectedRequest?.package?.type ? t(`package.${selectedRequest.package.type}`) : "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("الوزن", "Weight")}</p>
                  <p>{selectedRequest?.package?.weight ? `${selectedRequest.package.weight} kg` : "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("القيمة", "Value")}</p>
                  <p>
                    {selectedRequest?.package?.value
                      ? `${selectedRequest.package.value} ${selectedRequest.package.currency || ""}`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("الأبعاد", "Dimensions")}</p>
                  <p>
                    {(selectedRequest?.package?.length || selectedRequest?.package?.width || selectedRequest?.package?.height)
                      ? `${selectedRequest.package.length || "-"} x ${selectedRequest.package.width || "-"} x ${selectedRequest.package.height || "-"} cm`
                      : selectedRequest?.package?.dimensions || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("قابل للكسر", "Fragile")}</p>
                  <p>{selectedRequest?.package?.fragile ? tr("نعم", "Yes") : tr("لا", "No")}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{tr("التغليف", "Packaging")}</p>
                  <p>{selectedRequest?.package?.packagingRequested ? tr("تم الطلب", "Requested") : tr("لم يتم الطلب", "Not requested")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">{tr("وصف الطرد", "Package description")}</p>
                <p>{selectedRequest?.package?.description || "-"}</p>
              </div>
            </div>

            {isSelectedRequestPending && (
              <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-800">
                  {tr(
                    "بيانات الشحنة القابلة للتعديل",
                    "Editable shipment fields",
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{tr("نوع الشحن", "Shipping type")}</Label>
                    <select
                      value={reviewUpdatesForm.shippingType}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          shippingType: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{tr("اختر نوع الشحن", "Select shipping type")}</option>
                      <option value="local">{tr("محلي", "Local")}</option>
                      <option value="international">{tr("دولي", "International")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("نوع الطرد", "Package type")}</Label>
                    <select
                      value={reviewUpdatesForm.packageType}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageType: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
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
                    <Label>{tr("اسم المرسل", "Sender name")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderName}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("هاتف المرسل", "Sender phone")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderPhone}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("البريد الإلكتروني للمرسل", "Sender email")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderEmail}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("مدينة المرسل", "Sender city")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderCity}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderCity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("الولاية/المحافظة", "Sender state")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderState}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderState: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("البلد", "Sender country")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderCountry}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderCountry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("عنوان المرسل", "Sender street")}</Label>
                    <Input
                      value={reviewUpdatesForm.senderStreet}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          senderStreet: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{tr("اسم المستلم", "Receiver name")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverName}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("هاتف المستلم", "Receiver phone")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverPhone}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("البريد الإلكتروني للمستلم", "Receiver email")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverEmail}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("مدينة المستلم", "Receiver city")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverCity}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverCity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("الولاية/المحافظة", "Receiver state")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverState}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverState: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("البلد", "Receiver country")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverCountry}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverCountry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("عنوان المستلم", "Receiver street")}</Label>
                    <Input
                      value={reviewUpdatesForm.receiverStreet}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          receiverStreet: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-3">
                    <Label>{tr("وصف الطرد", "Package description")}</Label>
                    <Input
                      value={reviewUpdatesForm.packageDescription}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageDescription: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("وزن الطرد", "Package weight")}</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={reviewUpdatesForm.packageWeight}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageWeight: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("قيمة الطرد", "Package value")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reviewUpdatesForm.packageValue}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageValue: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("العملة", "Currency")}</Label>
                    <select
                      value={reviewUpdatesForm.packageCurrency}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageCurrency: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{tr("اختر العملة", "Select currency")}</option>
                      <option value="USD">USD</option>
                      <option value="SYP">SYP</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("طول الطرد", "Length (cm)")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reviewUpdatesForm.packageLength}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageLength: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("عرض الطرد", "Width (cm)")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reviewUpdatesForm.packageWidth}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageWidth: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("ارتفاع الطرد", "Height (cm)")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reviewUpdatesForm.packageHeight}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageHeight: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("قابل للكسر", "Fragile")}</Label>
                    <select
                      value={reviewUpdatesForm.packageFragile}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packageFragile: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{tr("اختر", "Select")}</option>
                      <option value="true">{tr("نعم", "Yes")}</option>
                      <option value="false">{tr("لا", "No")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>{tr("التغليف", "Packaging")}</Label>
                    <select
                      value={reviewUpdatesForm.packagePackagingRequested}
                      onChange={(e) =>
                        setReviewUpdatesForm((prev) => ({
                          ...prev,
                          packagePackagingRequested: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{tr("اختر", "Select")}</option>
                      <option value="true">{tr("تم الطلب", "Requested")}</option>
                      <option value="false">{tr("لم يتم الطلب", "Not requested")}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                {tr("إلغاء", "Cancel")}
              </Button>
              {isSelectedRequestPending && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-300"
                    onClick={() => submitReview("reject")}
                  >
                    {tr("رفض", "Reject")}
                  </Button>
                  <Button onClick={() => submitReview("approve")}>
                    {tr("تعديل", "Edit")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
