import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";

export default function WalletManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllTransactions({
        type: typeFilter,
        status: statusFilter,
        page,
        limit: 15,
      });
      setTransactions(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error(error.message || "فشل تحميل المعاملات");
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

  const getTypeIcon = (type: string) => {
    if (type === "deposit" || type === "refund") {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const typeOptions = [
    { value: "deposit", label: "إيداع" },
    { value: "withdrawal", label: "سحب" },
    { value: "payment", label: "دفع" },
    { value: "refund", label: "استرداد" },
    { value: "fee", label: "رسوم" },
    { value: "commission", label: "عمولة" },
  ];

  const statusOptions = [
    { value: "pending", label: "معلقة" },
    { value: "completed", label: "مكتملة" },
    { value: "failed", label: "فاشلة" },
    { value: "cancelled", label: "ملغاة" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        إدارة المحفظة والمعاملات
      </h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            <Button variant="outline" onClick={fetchTransactions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
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
                      <TableHead>المرجع</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.reference}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.userId?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.userId?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transaction.type)}>
                            {getTypeIcon(transaction.type)}
                            <span className="ml-1">
                              {typeOptions.find(
                                (t) => t.value === transaction.type
                              )?.label || transaction.type}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {transaction.amount} {transaction.currency}
                        </TableCell>
                        <TableCell>{transaction.method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {statusOptions.find(
                              (s) => s.value === transaction.status
                            )?.label || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleString(
                            "ar-SY"
                          )}
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
