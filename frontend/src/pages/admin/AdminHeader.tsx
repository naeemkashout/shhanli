import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Ban,
  BarChart3,
  Banknote,
  Building2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Pencil,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminHeader({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isPlatformAdmin = ["admin", "super-admin"].includes(user?.role || "");
  const isCompanyAdmin = user?.role === "company-admin";

  const navigationItems = [
    {
      name: "الرئيسية",
      href: "/admin",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      name: isCompanyAdmin ? "شركتي" : "الشركات",
      href: "/admin/companies",
      icon: Building2,
      visible: isPlatformAdmin || isCompanyAdmin,
    },
    {
      name: "المستخدمون",
      href: "/admin/users",
      icon: Users,
      visible: isPlatformAdmin,
    },
    {
      name: "الشحنات",
      href: "/admin/shipments",
      icon: ClipboardList,
      visible: true,
    },
    {
      name: "طلبات الإلغاء",
      href: "/admin/cancellation-requests",
      icon: Ban,
      visible: true,
    },
    {
      name: "طلبات التعديل",
      href: "/admin/edit-requests",
      icon: Pencil,
      visible: true,
    },
    {
      name: "طلبات سحب الرصيد",
      href: "/admin/withdrawal-requests",
      icon: Banknote,
      visible: isPlatformAdmin,
    },
    {
      name: "إيرادات الشركات",
      href: "/admin/revenue-analytics",
      icon: BarChart3,
      visible: isPlatformAdmin,
    },
    {
      name: isCompanyAdmin ? "المعاملات المالية" : "المعاملات",
      href: "/admin/wallet",
      icon: Wallet,
      visible: isPlatformAdmin,
    },
    {
      name: "فواتير المقارنة",
      href: "/admin/comparison-invoices",
      icon: ScrollText,
      visible: true,
    },
    {
      name: "النشاطات",
      href: "/admin/activity",
      icon: ScrollText,
      visible: isPlatformAdmin,
    },
    {
      name: "تغيير كلمة المرور",
      href: "/admin/change-password",
      icon: KeyRound,
      visible: true,
    },
  ].filter((item) => item.visible);

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="w-full flex items-center justify-between px-2 sm:px-3 lg:px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">لوحة التحكم</h1>
            <p className="text-sm text-slate-500">
              {isPlatformAdmin
                ? "إدارة المنصة وشركات الشحن"
                : "إدارة شركة الشحن الخاصة بك"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full grid gap-6 px-2 sm:px-3 lg:px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
