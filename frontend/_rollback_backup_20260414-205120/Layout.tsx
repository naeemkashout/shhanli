import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Package,
  Home,
  Truck,
  Building2,
  Plus,
  Users,
  CreditCard,
  ScrollText,
  User,
  Search,
  Menu,
  LogOut,
  Globe,
  X,
  Info,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationService from "@/services/notificationService";
import { io, Socket } from "socket.io-client";

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
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const playNotificationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.08,
        audioContext.currentTime + 0.02,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.25,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.26);

      oscillator.onended = () => {
        audioContext.close().catch(() => {
          // Ignore close errors.
        });
      };
    } catch (error) {
      // Ignore sound playback errors (browser autoplay restrictions, etc.)
    }
  };

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadNotifications(count);
      } catch (error) {
        // Silent fail for optional header badge.
      }
    };

    loadUnread();
  }, [location.pathname]);

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!userId) return;

    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("new-notification", () => {
      setUnreadNotifications((prev) => prev + 1);
      playNotificationSound();
    });

    const onNotificationsSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ unreadCount?: number }>;
      const nextUnreadCount = Number(customEvent?.detail?.unreadCount);
      if (Number.isFinite(nextUnreadCount) && nextUnreadCount >= 0) {
        setUnreadNotifications(nextUnreadCount);
      }
    };

    window.addEventListener(
      "notifications:sync",
      onNotificationsSync as EventListener,
    );

    return () => {
      window.removeEventListener(
        "notifications:sync",
        onNotificationsSync as EventListener,
      );
      socket.disconnect();
    };
  }, [user?.id]);

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
      name: t("nav.companies"),
      href: "/companies",
      icon: Building2,
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
    //   name: t("nav.notifications"),
    //   href: "/notifications",
    //   icon: Bell,
    // },
    {
      name: t("nav.financialTransactions"),
      href: "/financial-transactions",
      icon: ScrollText,
    },
    {
      name: language === "ar" ? "من نحن" : "About Us",
      href: "/about-us",
      icon: Info,
    },
    {
      name: language === "ar" ? "تواصل معنا" : "Contact Us",
      href: "/contact-us",
      icon: MessageCircle,
    },
    ...(["admin", "super-admin", "company-admin"].includes(user?.role || "")
      ? [
          {
            name: "لوحة التحكم",
            href: "/admin",
            icon: User,
          },
        ]
      : []),
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
        <div className="w-full px-2 sm:px-3 lg:px-4">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/notifications")}
                className="relative min-h-[44px] min-w-[44px] p-2"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center px-1">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
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
      <main className="w-full px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
