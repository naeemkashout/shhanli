import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Filter } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, categoryFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getActivityLogs({
        action: actionFilter,
        category: categoryFilter,
        page,
        limit: 20,
      });
      setLogs(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error(error.message || "فشل تحميل سجل النشاطات");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      auth: "bg-blue-100 text-blue-800",
      shipment: "bg-purple-100 text-purple-800",
      wallet: "bg-green-100 text-green-800",
      profile: "bg-yellow-100 text-yellow-800",
      admin: "bg-red-100 text-red-800",
      system: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const categoryOptions = [
    { value: "auth", label: "المصادقة" },
    { value: "shipment", label: "الشحنات" },
    { value: "wallet", label: "المحفظة" },
    { value: "profile", label: "الملف الشخصي" },
    { value: "admin", label: "إداري" },
    { value: "system", label: "النظام" },
  ];

  const actionOptions = [
    { value: "login", label: "تسجيل دخول" },
    { value: "logout", label: "تسجيل خروج" },
    { value: "register", label: "تسجيل" },
    { value: "create-shipment", label: "إنشاء شحنة" },
    { value: "update-shipment", label: "تحديث شحنة" },
    { value: "cancel-shipment", label: "إلغاء شحنة" },
    { value: "deposit", label: "إيداع" },
    { value: "withdrawal", label: "سحب" },
    { value: "payment", label: "دفع" },
    { value: "update-profile", label: "تحديث الملف" },
    { value: "change-password", label: "تغيير كلمة المرور" },
    { value: "admin-action", label: "إجراء إداري" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">سجل النشاطات</h1>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الفئات</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الإجراءات</option>
              {actionOptions.map((option) => (
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
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>عنوان IP</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {log.userId?.name || "مستخدم"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.userId?.email || "غير متوفر"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(log.category)}>
                            {categoryOptions.find(
                              (c) => c.value === log.category
                            )?.label || log.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {actionOptions.find((a) => a.value === log.action)
                              ?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{log.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status === "success"
                              ? "نجح"
                              : log.status === "failed"
                              ? "فشل"
                              : "تحذير"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || "غير متوفر"}
                        </TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString("ar-SY")}
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
    </div>
  );
}
