import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Package,
  Home,
  Truck,
  Plus,
  Users,
  CreditCard,
  User,
  Search,
  Menu,
  LogOut,
  Globe,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const [confirmLogout, setConfirmLogout] = useState(false);

  // Force close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Always start with drawer closed and handle window resize
  useEffect(() => {
    // Always start closed
    setIsOpen(false);

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigationItems = [
    {
      name: t("nav.dashboard"),
      href: "/dashboard",
      icon: Home,
    },
    {
      name: t("nav.createShipment"),
      href: "/create-shipment",
      icon: Plus,
    },
    {
      name: t("nav.shipments"),
      href: "/shipments",
      icon: Truck,
    },
    {
      name: t("nav.contacts"),
      href: "/contacts",
      icon: Users,
    },
    {
      name: t("nav.balance"),
      href: "/balance",
      icon: CreditCard,
    },
    // {
    //   name: t("nav.profile"),
    //   href: "/profile",
    //   icon: User,
    // },
  ];

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/signin");
  };

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
    setIsOpen(false);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                شحنلي
              </span>
            </div>

            {/* Desktop Navigation - Show on large screens */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 space-x-reverse">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Switcher - Show on all screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="min-h-[44px] px-2 sm:px-3"
              >
                <Globe className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm">
                  {language === "ar" ? "EN" : "AR"}
                </span>
              </Button>
              {/* User Menu - Show on desktop only */}
              <div className="relative">
                <div
                  className="hidden sm:flex items-center gap-3 cursor-pointer"
                  onClick={() => setOpen(!open)}
                >
                  <div
                    className={`text-${
                      isRTL ? "left" : "right"
                    } hidden md:block`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name ||
                        (language === "ar" ? "أحمد محمد" : "Ahmed Mohammed")}
                    </p>
                  </div>

                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>

                {open && (
                  <div
                    className={`absolute top-12 ${
                      isRTL ? "right-0" : "left-0"
                    } w-40 bg-white shadow-lg rounded-md border p-2`}
                  >
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                      onClick={() => {
                        setOpen(false);
                        navigate("/profile");
                      }}
                    >
                      {language === "ar" ? "الملف الشخصي" : "Profile"}
                    </button>

                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-600"
                      onClick={() => {
                        setOpen(false);
                        setConfirmLogout(true); // show dialog
                      }}
                    >
                      {language === "ar" ? "تسجيل الخروج" : "Logout"}
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ CONFIRM LOGOUT DIALOG OUTSIDE THE POPOVER */}
              {confirmLogout && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-5 rounded-lg shadow-lg w-80 text-center">
                    <p className="text-lg font-medium mb-4">
                      {language === "ar"
                        ? "هل أنت متأكد أنك تريد تسجيل الخروج؟"
                        : "Are you sure you want to logout?"}
                    </p>

                    <div className="flex justify-between gap-3">
                      <button
                        className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={() => setConfirmLogout(false)}
                      >
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </button>

                      <button
                        className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => {
                          setConfirmLogout(false);
                          logout(); // your logout function
                        }}
                      >
                        {language === "ar" ? "تأكيد" : "Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Menu - Show on mobile only */}
              <div className="lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] p-2"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side={isRTL ? "right" : "left"}
                    className="w-[min(320px,85vw)] p-0"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between px-4 py-4 sm:py-6 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {/* {language === "ar" ? "شحنلي" : "Shahnli"} */}
                            شحنلي
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsOpen(false)}
                          className="min-h-[44px] min-w-[44px] p-2"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* User info in mobile */}
                      <div className="px-4 py-4 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user?.name ||
                                (language === "ar"
                                  ? "أحمد محمد"
                                  : "Ahmed Mohammed")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user?.email || "user@example.com"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <nav className="flex-1 py-4 px-4">
                        <div className="space-y-1">
                          {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                                  isActive
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      </nav>

                      <div className="px-4 py-4 border-t space-y-2">
                        <Button
                          variant="ghost"
                          onClick={toggleLanguage}
                          className="w-full justify-start min-h-[48px]"
                        >
                          <Globe className="w-4 h-4 mr-3" />
                          {language === "ar" ? "English" : "العربية"}
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[48px]"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {t("nav.logout")}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
