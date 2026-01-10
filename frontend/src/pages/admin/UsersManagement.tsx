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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, UserCheck, UserX, Download } from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    isActive: true,
    role: "user",
    balanceUSD: 0,
    balanceSYP: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers({
        search,
        page,
        limit: 10,
      });
      setUsers(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error(error.message || "فشل تحميل المستخدمين");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      isActive: user.isActive,
      role: user.role,
      balanceUSD: user.balance.USD,
      balanceSYP: user.balance.SYP,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await adminService.updateUser(selectedUser._id, {
        isActive: editFormData.isActive,
        role: editFormData.role,
        balance: {
          USD: editFormData.balanceUSD,
          SYP: editFormData.balanceSYP,
        },
      });
      toast.success("تم تحديث المستخدم بنجاح");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث المستخدم");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      await adminService.deleteUser(userId);
      toast.success("تم حذف المستخدم بنجاح");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف المستخدم");
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await adminService.exportToExcel("users");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${Date.now()}.xlsx`;
      a.click();
      toast.success("تم تصدير البيانات بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل تصدير البيانات");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
        <Button onClick={handleExportUsers} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تصدير Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الرصيد (USD)</TableHead>
                    <TableHead>الرصيد (SYP)</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>${user.balance.USD.toFixed(2)}</TableCell>
                      <TableCell>{user.balance.SYP.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <UserCheck className="w-3 h-3 mr-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <UserX className="w-3 h-3 mr-1" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الحالة</Label>
              <select
                value={editFormData.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    isActive: e.target.value === "active",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div>
              <Label>الدور</Label>
              <select
                value={editFormData.role}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="user">مستخدم</option>
                <option value="admin">مدير</option>
                <option value="super-admin">مدير أعلى</option>
              </select>
            </div>
            <div>
              <Label>الرصيد (USD)</Label>
              <Input
                type="number"
                value={editFormData.balanceUSD}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    balanceUSD: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>الرصيد (SYP)</Label>
              <Input
                type="number"
                value={editFormData.balanceSYP}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    balanceSYP: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleUpdateUser}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
