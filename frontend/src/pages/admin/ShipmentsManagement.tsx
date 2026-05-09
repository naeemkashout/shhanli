import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, Download, Package } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ShipmentsManagement() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company-admin";
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companyNameFilter, setCompanyNameFilter] = useState("");
  const [senderNameFilter, setSenderNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    correctedWeight: "",
    weightAdjustmentNote: "",
  });

  useEffect(() => {
    fetchShipments();
  }, [page, search, statusFilter, companyFilter, companyNameFilter, senderNameFilter, startDate, endDate]);

  useEffect(() => {
    if (!user || isCompanyAdmin) return;
    const fetchCompanies = async () => {
      try {
        const response = await adminService.getAllCompanies({ limit: 100 });
        setCompanies(response.data || []);
      } catch (error: any) {
        toast.error(
          error.message ||
            tr("فشل تحميل شركات الشحن", "Failed to load shipping companies"),
        );
      }
    };

    fetchCompanies();
  }, [user, isCompanyAdmin]);

  useEffect(() => {
    if (!isCompanyAdmin) return;

    const rawCompanyId =
      typeof user?.shippingCompanyId === "string"
        ? user.shippingCompanyId
        : user?.shippingCompanyId?._id;

    const companyId = String(rawCompanyId || "").trim();
    if (!companyId) return;

    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-company-room", companyId);
    });

    socket.on("shipment-weight-adjusted", (payload: any) => {
      toast.info(
        language === "ar"
          ? `تم تعديل وزن الشحنة ${payload?.trackingNumber || ""}`
          : `Shipment ${payload?.trackingNumber || ""} weight was adjusted`,
      );
      fetchShipments();
    });

    return () => {
      socket.disconnect();
    };
  }, [isCompanyAdmin, user?.shippingCompanyId, language]);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search,
        status: statusFilter,
        senderName: senderNameFilter,
        startDate,
        endDate,
        page,
        limit: 10,
      };

      if (companyFilter) {
        params.companyId = companyFilter;
      }
      if (companyNameFilter) {
        params.companyName = companyNameFilter;
      }

      const response = await adminService.getAllShipments(params);
      setShipments(response.data);
      setTotalPages(response.pagination.pages);
      setShipmentsCount(response.pagination.total);
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تحميل الشحنات", "Failed to load shipments"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (shipment: any) => {
    setSelectedShipment(shipment);
    // حساب الحالة التالية المتاحة
    const statusOrder = [
      "pending",
      "confirmed",
      "picked-up",
      "in-transit",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(shipment.status);
    let nextStatus = "";
    if (currentIndex > -1 && currentIndex < statusOrder.length - 1) {
      nextStatus = statusOrder[currentIndex + 1];
    }
    setUpdateFormData({
      status: nextStatus,
      correctedWeight: shipment.package?.weight
        ? String(shipment.package.weight)
        : "",
      weightAdjustmentNote: shipment.weightAdjustment?.note || "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      await adminService.updateShipmentStatus(selectedShipment._id, {
        status: updateFormData.status,
        correctedWeight: updateFormData.correctedWeight
          ? Number(updateFormData.correctedWeight)
          : undefined,
        weightAdjustmentNote: updateFormData.weightAdjustmentNote,
      });
      toast.success(
        tr(
          "تم تحديث حالة الشحنة بنجاح",
          "Shipment status updated successfully",
        ),
      );
      setIsUpdateDialogOpen(false);
      fetchShipments();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحديث حالة الشحنة", "Failed to update shipment status"),
      );
    }
  };

  const handleExportShipments = async () => {
    try {
      const blob = await adminService.exportToExcel("shipments", {
        language: language === "ar" ? "ar" : "en",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shipments-${Date.now()}.xlsx`;
      a.click();
      toast.success(
        tr("تم تصدير البيانات بنجاح", "Data exported successfully"),
      );
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تصدير البيانات", "Failed to export data"),
      );
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      "picked-up": "bg-purple-100 text-purple-800",
      "in-transit": "bg-indigo-100 text-indigo-800",
      "out-for-delivery": "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const allStatusOptions = [
    { value: "pending", label: tr("معلقة", "Pending"), key: "status.pending" },
    {
      value: "confirmed",
      label: tr("مؤكدة", "Confirmed"),
      key: "status.confirmed",
    },
    {
      value: "picked-up",
      label: tr("تم الاستلام من المرسل", "Picked Up"),
      key: "status.picked-up",
    },
    {
      value: "in-transit",
      label: tr("قيد النقل", "In Transit"),
      key: "status.in-transit",
    },
    {
      value: "out-for-delivery",
      label: tr("خارج للتوصيل", "Out For Delivery"),
      key: "status.out-for-delivery",
    },
    {
      value: "delivered",
      label: tr("تم التسليم", "Delivered"),
      key: "status.delivered",
    },
    {
      value: "cancelled",
      label: tr("ملغية", "Cancelled"),
      key: "status.cancelled",
    },
    {
      value: "returned",
      label: tr("مرتجعة", "Returned"),
      key: "status.returned",
    },
  ];

  // دالة ترجمة الحالة لأي مكان في الجدول
  const getStatusLabel = (status) => {
    const found = allStatusOptions.find((s) => s.value === status);
    return found ? found.label : status;
  };

  // Restrict company-admins to only three statuses
  // منطق الترتيب: لا يمكن القفز بين الحالات، ولا تظهر حالات "ملغية" و"خارج التوصيل" لشركة الشحن
  let statusOptions = allStatusOptions;
  if (isCompanyAdmin) {
    // إلغاء حالة "ملغية" و"خارج التوصيل"
    statusOptions = statusOptions.filter(
      (opt) => opt.value !== "cancelled" && opt.value !== "out-for-delivery",
    );
    // إذا كانت الحالة الحالية "confirmed"، إخفاء "returned"
    if (selectedShipment?.status === "confirmed") {
      statusOptions = statusOptions.filter((opt) => opt.value !== "returned");
    }
    // السماح فقط بالحالة التالية في الترتيب
    const statusOrder = [
      "pending",
      "confirmed",
      "picked-up",
      "in-transit",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(selectedShipment?.status || "");
    if (currentIndex > -1 && currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1];
      statusOptions = statusOptions.filter((opt) => opt.value === nextStatus);
    } else {
      // إذا لم يوجد حالة تالية، لا تظهر خيارات
      statusOptions = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الشحنات</h1>
        <Button onClick={handleExportShipments} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تصدير Excel
        </Button>
      </div>

      {shipments.some((shipment) => shipment.weightAdjustment?.isAdjusted) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              {language === "ar"
                ? "الشحنات ذات الوزن المعدل مميزة باللون الأصفر."
                : "Shipments with adjusted weight are highlighted in yellow."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="البحث برقم التتبع، المرسل، أو المستلم..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الحالات</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {!isCompanyAdmin && (
                  <select
                    value={companyFilter}
                    onChange={(e) => {
                      setCompanyFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع شركات الشحن</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Input
                placeholder="فلترة باسم شركة الشحن"
                value={companyNameFilter}
                onChange={(e) => {
                  setCompanyNameFilter(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder="فلترة باسم المرسل"
                value={senderNameFilter}
                onChange={(e) => {
                  setSenderNameFilter(e.target.value);
                  setPage(1);
                }}
              />
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">
                  عدد الشحنات: <span className="font-semibold">{shipmentsCount}</span>
                </div>
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
                      <TableHead>رقم التتبع</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>من</TableHead>
                      <TableHead>إلى</TableHead>
                      <TableHead>شركة الشحن</TableHead>
                      <TableHead>الوزن</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow
                        key={shipment._id}
                        className={`${shipment.weightAdjustment?.isAdjusted ? "bg-amber-50" : ""} align-top`}
                      >
                        <TableCell className="font-medium break-words">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell className="break-words">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {shipment.userId?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {shipment.userId?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm break-words">
                          {shipment.sender.city}, {shipment.sender.country}
                        </TableCell>
                        <TableCell className="text-sm break-words">
                          {shipment.receivers?.[0]?.city || "-"},{" "}
                          {shipment.receivers?.[0]?.country || "-"}
                        </TableCell>
                        <TableCell className="break-words">
                          {shipment.shippingCompany?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {shipment.package?.weight || "-"} kg
                            </p>
                            {shipment.weightAdjustment?.isAdjusted && (
                              <Badge className="bg-amber-100 text-amber-800">
                                {shipment.weightAdjustment?.originalWeight} →{" "}
                                {shipment.weightAdjustment?.correctedWeight} kg
                              </Badge>
                            )}
                            {shipment.weightAdjustment?.balanceDeduction
                              ?.status === "insufficient-cancelled" && (
                              <Badge className="bg-red-100 text-red-800">
                                {language === "ar"
                                  ? "ملغاة بسبب عدم كفاية رصيد العميل"
                                  : "Cancelled: customer insufficient balance"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)}>
                            {(() => {
                              return getStatusLabel(shipment.status);
                            })()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.cost.amount} {shipment.cost.currency}
                        </TableCell>
                        <TableCell>
                          {new Date(shipment.createdAt).toLocaleDateString(
                            "ar-SY",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(shipment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
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

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الشحنة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>رقم التتبع</Label>
              <Input value={selectedShipment?.trackingNumber || ""} disabled />
            </div>
            <div>
              <Label>الحالة الجديدة</Label>
              <select
                value={updateFormData.status}
                onChange={(e) =>
                  setUpdateFormData({
                    ...updateFormData,
                    status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {(isCompanyAdmin
                  ? statusOptions.filter(
                      (option) => option.value !== selectedShipment?.status,
                    )
                  : statusOptions
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.key && typeof t === "function"
                      ? t(option.key)
                      : option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>الوزن المصحح (كغ)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={updateFormData.correctedWeight}
                onChange={(e) =>
                  setUpdateFormData({
                    ...updateFormData,
                    correctedWeight: e.target.value,
                  })
                }
                placeholder="مثال: 2.5"
              />
            </div>
            <div>
              <Label>ملاحظة تصحيح الوزن</Label>
              <Textarea
                value={updateFormData.weightAdjustmentNote}
                onChange={(e) =>
                  setUpdateFormData({
                    ...updateFormData,
                    weightAdjustmentNote: e.target.value,
                  })
                }
                placeholder="سبب/تفاصيل تصحيح الوزن (اختياري)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitUpdate}>تحديث الحالة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
