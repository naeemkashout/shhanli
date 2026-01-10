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

export default function ShipmentsManagement() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    note: "",
    location: "",
  });

  useEffect(() => {
    fetchShipments();
  }, [page, search, statusFilter]);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllShipments({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setShipments(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error(error.message || "فشل تحميل الشحنات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (shipment: any) => {
    setSelectedShipment(shipment);
    setUpdateFormData({
      status: shipment.status,
      note: "",
      location: "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      await adminService.updateShipmentStatus(
        selectedShipment._id,
        updateFormData
      );
      toast.success("تم تحديث حالة الشحنة بنجاح");
      setIsUpdateDialogOpen(false);
      fetchShipments();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث حالة الشحنة");
    }
  };

  const handleExportShipments = async () => {
    try {
      const blob = await adminService.exportToExcel("shipments");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shipments-${Date.now()}.xlsx`;
      a.click();
      toast.success("تم تصدير البيانات بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل تصدير البيانات");
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

  const statusOptions = [
    { value: "pending", label: "معلقة" },
    { value: "confirmed", label: "مؤكدة" },
    { value: "picked-up", label: "تم الاستلام" },
    { value: "in-transit", label: "قيد النقل" },
    { value: "out-for-delivery", label: "خارج للتوصيل" },
    { value: "delivered", label: "تم التسليم" },
    { value: "cancelled", label: "ملغاة" },
    { value: "returned", label: "مرتجعة" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الشحنات</h1>
        <Button onClick={handleExportShipments} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تصدير Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="البحث برقم التتبع، المرسل، أو المستلم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم التتبع</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>من</TableHead>
                      <TableHead>إلى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment._id}>
                        <TableCell className="font-medium">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {shipment.userId?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {shipment.userId?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.sender.city}, {shipment.sender.country}
                        </TableCell>
                        <TableCell>
                          {shipment.receiver.city}, {shipment.receiver.country}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)}>
                            {statusOptions.find(
                              (s) => s.value === shipment.status
                            )?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.cost.amount} {shipment.cost.currency}
                        </TableCell>
                        <TableCell>
                          {new Date(shipment.createdAt).toLocaleDateString(
                            "ar-SY"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(shipment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>الموقع</Label>
              <Input
                value={updateFormData.location}
                onChange={(e) =>
                  setUpdateFormData({
                    ...updateFormData,
                    location: e.target.value,
                  })
                }
                placeholder="الموقع الحالي للشحنة"
              />
            </div>
            <div>
              <Label>ملاحظة</Label>
              <Textarea
                value={updateFormData.note}
                onChange={(e) =>
                  setUpdateFormData({ ...updateFormData, note: e.target.value })
                }
                placeholder="أضف ملاحظة (اختياري)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSubmitUpdate}>تحديث الحالة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
