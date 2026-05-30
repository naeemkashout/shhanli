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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UsersManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const isPlatformAdmin = ["admin", "super-admin"].includes(user?.role || "");
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessType: "individual",
    companyName: "",
    commercialRegistrationNumber: "",
    address: "",
    isActive: true,
    role: "user",
    balanceUSD: 0,
    balanceSYP: 0,
    shippingCompanyId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [page, search, companyId]);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchCompanies();
    }
  }, [isPlatformAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers({
        role: "user",
        search,
        companyId: isPlatformAdmin ? companyId || undefined : undefined,
        page,
        limit: 10,
      });
      setUsers(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تحميل المستخدمين", "Failed to load users"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await adminService.getAllCompanies({ limit: 100 });
      setCompanies(response.data);
    } catch {
      setCompanies([]);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      businessType: user.businessType || "individual",
      companyName: user.companyName || "",
      commercialRegistrationNumber: user.commercialRegistrationNumber || "",
      address: user.address || "",
      isActive: user.isActive,
      role: user.role,
      balanceUSD: user.balance?.USD || 0,
      balanceSYP: user.balance?.SYP || 0,
      shippingCompanyId:
        typeof user.shippingCompanyId === "string"
          ? user.shippingCompanyId
          : user.shippingCompanyId?._id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await adminService.updateUser(selectedUser._id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        businessType: editFormData.businessType,
        companyName: editFormData.companyName,
        commercialRegistrationNumber:
          editFormData.commercialRegistrationNumber,
        address: editFormData.address,
        isActive: editFormData.isActive,
        role: ["admin", "super-admin"].includes(user?.role || "")
          ? editFormData.role
          : undefined,
        shippingCompanyId: ["admin", "super-admin"].includes(user?.role || "")
          ? editFormData.shippingCompanyId || null
          : undefined,
        balance: {
          USD: editFormData.balanceUSD,
          SYP: editFormData.balanceSYP,
        },
      });
      toast.success(tr("تم تحديث المستخدم بنجاح", "User updated successfully"));
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تحديث المستخدم", "Failed to update user"),
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        tr(
          "هل أنت متأكد من حذف هذا المستخدم؟",
          "Are you sure you want to delete this user?",
        ),
      )
    )
      return;

    try {
      await adminService.deleteUser(userId);
      toast.success(tr("تم حذف المستخدم بنجاح", "User deleted successfully"));
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل حذف المستخدم", "Failed to delete user"),
      );
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
      toast.success(
        tr("تم تصدير البيانات بنجاح", "Data exported successfully"),
      );
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل تصدير البيانات", "Failed to export data"),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {tr("إدارة العملاء", "Customers Management")}
        </h1>
        <Button onClick={handleExportUsers} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {tr("تصدير Excel", "Export Excel")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={tr(
                  "البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف...",
                  "Search by name, email, or phone...",
                )}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            {isPlatformAdmin && (
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setPage(1);
                }}
                className="w-56 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{tr("كل الشركات", "All Companies")}</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
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
                    <TableHead>{tr("الاسم", "Name")}</TableHead>
                    <TableHead>{tr("البريد الإلكتروني", "Email")}</TableHead>
                    <TableHead>{tr("الهاتف", "Phone")}</TableHead>
                    <TableHead>{tr("نوع الحساب", "Account Type")}</TableHead>
                    <TableHead>{tr("الشركة", "Company")}</TableHead>
                    <TableHead>{tr("السجل التجاري", "Commercial Registration")}</TableHead>
                    <TableHead>{tr("العنوان", "Address")}</TableHead>
                    <TableHead>{tr("الرصيد (USD)", "Balance (USD)")}</TableHead>
                    <TableHead>{tr("الرصيد (SYP)", "Balance (SYP)")}</TableHead>
                    <TableHead>
                      {tr("شركة الشحن", "Shipping Company")}
                    </TableHead>
                    <TableHead>{tr("الدور", "Role")}</TableHead>
                    <TableHead>{tr("الحالة", "Status")}</TableHead>
                    <TableHead>{tr("الإجراءات", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.businessType || "-"}</TableCell>
                      <TableCell>{user.companyName || "-"}</TableCell>
                      <TableCell>
                        {user.commercialRegistrationNumber || "-"}
                      </TableCell>
                      <TableCell>{user.address || "-"}</TableCell>
                      <TableCell>${user.balance.USD.toFixed(2)}</TableCell>
                      <TableCell>{user.balance.SYP.toLocaleString()}</TableCell>
                      <TableCell>
                        {typeof user.shippingCompanyId === "string"
                          ? user.shippingCompanyId
                          : user.shippingCompanyId?.name || "-"}
                      </TableCell>
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
                            {tr("نشط", "Active")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <UserX className="w-3 h-3 mr-1" />
                            {tr("غير نشط", "Inactive")}
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
                            disabled={user.role === "company-admin"}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("تعديل المستخدم", "Edit User")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{tr("الاسم الكامل", "Full Name")}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{tr("البريد الإلكتروني", "Email")}</Label>
              <Input
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{tr("الهاتف", "Phone")}</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{tr("نوع الحساب", "Account Type")}</Label>
              <select
                value={editFormData.businessType}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    businessType: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="individual">
                  {tr("فردي", "Individual")}
                </option>
                <option value="merchant">
                  {tr("تجاري", "Merchant")}
                </option>
              </select>
            </div>
            <div>
              <Label>{tr("الشركة", "Company")}</Label>
              <Input
                value={editFormData.companyName}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    companyName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>{tr("السجل التجاري", "Commercial Registration")}</Label>
              <Input
                value={editFormData.commercialRegistrationNumber}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    commercialRegistrationNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>{tr("العنوان", "Address")}</Label>
              <Input
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    address: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>{tr("الحالة", "Status")}</Label>
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
                <option value="active">{tr("نشط", "Active")}</option>
                <option value="inactive">{tr("غير نشط", "Inactive")}</option>
              </select>
            </div>
            {["admin", "super-admin"].includes(user?.role || "") && (
              <>
                <div>
                  <Label>{tr("الدور", "Role")}</Label>
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="user">{tr("مستخدم", "User")}</option>
                    <option value="company-admin">
                      {tr("مدير شركة", "Company Admin")}
                    </option>
                    <option value="admin">
                      {tr("مدير منصة", "Platform Admin")}
                    </option>
                    <option value="super-admin">
                      {tr("مدير أعلى", "Super Admin")}
                    </option>
                  </select>
                </div>
                <div>
                  <Label>{tr("شركة الشحن", "Shipping Company")}</Label>
                  <select
                    value={editFormData.shippingCompanyId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        shippingCompanyId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{tr("بدون شركة", "No Company")}</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <Label>{tr("الرصيد (USD)", "Balance (USD)")}</Label>
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
              <Label>{tr("الرصيد (SYP)", "Balance (SYP)")}</Label>
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
              {tr("إلغاء", "Cancel")}
            </Button>
            <Button onClick={handleUpdateUser}>
              {tr("حفظ التغييرات", "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
