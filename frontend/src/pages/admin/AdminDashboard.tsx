import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  DollarSign,
  HandCoins,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react";
import adminService from "@/services/adminService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPlatformAdmin = ["admin", "super-admin"].includes(user?.role || "");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboardStats(period);
      setStats(data);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل الإحصائيات", "Failed to load dashboard statistics"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isPlatformAdmin
              ? tr("لوحة تحكم مالك المنصة", "Platform Owner Dashboard")
              : tr("لوحة تحكم شركة الشحن", "Shipping Company Dashboard")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats?.currentCompany?.name
              ? tr(
                  `نطاق العرض: ${stats.currentCompany.name}`,
                  `Scope: ${stats.currentCompany.name}`,
                )
              : tr(
                  "إحصائيات جميع شركات الشحن والمستخدمين في المنصة.",
                  "Statistics for all shipping companies and users on the platform.",
                )}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">{tr("آخر 7 أيام", "Last 7 days")}</option>
          <option value="30">{tr("آخر 30 يوم", "Last 30 days")}</option>
          <option value="90">{tr("آخر 90 يوم", "Last 90 days")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isPlatformAdmin ? (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    شركات الشحن
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.companies?.total || 0}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    {stats?.companies?.active || 0} مفعلة
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <Users className="w-8 h-8 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">شركتي</p>
                  <p className="text-xl font-bold text-gray-900 mt-2 truncate">
                    {stats?.currentCompany?.name || "-"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    الكود: {stats?.currentCompany?.code || "-"}
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <Users className="w-8 h-8 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isPlatformAdmin && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    إجمالي المستخدمين
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.users?.total || 0}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />+
                    {stats?.users?.new || 0} جديد
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  إجمالي الشحنات
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.shipments?.total || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />+
                  {stats?.shipments?.new || 0} جديد
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">شحنات معلقة</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.shipments?.pending || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  قيد الانتظار
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${stats?.revenue?.USD?.toFixed(2) || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats?.revenue?.SYP?.toLocaleString() || 0} ل.س
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            {isPlatformAdmin && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/revenue-analytics")}
                >
                  {tr("فتح التحليل الموسع", "Open Detailed Analysis")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isPlatformAdmin && (
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/admin/withdrawal-requests")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    طلبات سحب الرصيد
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.withdrawalRequests?.pending || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    $
                    {stats?.withdrawalRequests?.pendingAmountUSD?.toFixed(2) ||
                      0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats?.withdrawalRequests?.pendingAmountSYP?.toLocaleString() ||
                      0}{" "}
                    ل.س
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <HandCoins className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isPlatformAdmin && (
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/admin/edit-requests")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    طلبات تعديل الشحنات
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.requestCounts?.editRequests || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {tr("فتح صفحة التعديلات", "Open edit requests")}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isPlatformAdmin && (
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/admin/cancellation-requests")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    طلبات إلغاء الشحنات
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.requestCounts?.cancellationRequests || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {tr("فتح صفحة الإلغاءات", "Open cancellation requests")}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isPlatformAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>ملخص الشركات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.companies?.items?.map((company: any) => (
                  <div
                    key={company._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {company.name}
                      </p>
                      <p className="text-xs text-gray-500">{company.code}</p>
                    </div>
                    <div className="text-sm text-gray-600 text-right">
                      <p>المستخدمون: {company.usersCount || 0}</p>
                      <p>الشحنات: {company.shipmentsCount || 0}</p>
                    </div>
                  </div>
                ))}
                {(!stats?.companies?.items ||
                  stats.companies.items.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    لا توجد شركات بعد
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <p>اسم الشركة: {stats?.currentCompany?.name || "-"}</p>
                <p>الكود: {stats?.currentCompany?.code || "-"}</p>
                <p>عدد الشحنات: {stats?.shipments?.total || 0}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>حالة الشحنات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">معلقة</span>
                </div>
                <span className="text-xl font-bold">
                  {stats?.shipments?.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">قيد النقل</span>
                </div>
                <span className="text-xl font-bold">
                  {stats?.shipments?.inTransit || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">تم التسليم</span>
                </div>
                <span className="text-xl font-bold">
                  {stats?.shipments?.delivered || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPlatformAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>النشاطات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentActivities?.slice(0, 5).map((activity: any) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Activity className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.userId?.name || "مستخدم"} •{" "}
                        {new Date(activity.createdAt).toLocaleString("ar-SY")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivities ||
                  stats.recentActivities.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    لا توجد نشاطات حديثة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
