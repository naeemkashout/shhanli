import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  CheckCircle,
  Plus,
  Wallet,
  Globe,
  MapPin,
  XCircle,
  Truck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeLocalApiUrl } from "@/services/api";
import { Link } from "react-router-dom";
import shipmentService from "@/services/shipmentService";
import walletService from "@/services/walletService";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();

  const [showBalance, setShowBalance] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalShipments: 0,
    localShipments: 0,
    internationalShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    completedShipments: 0,
    cancelledShipments: 0,
    walletBalance: {
      USD: 0,
      SYP: 0,
    },
  });
  const [loading, setLoading] = React.useState(true);

  const loadWalletBalance = React.useCallback(async () => {
    try {
      const response = await walletService.getBalance();
      const balance = response?.balance || {};

      setStats((prev) => ({
        ...prev,
        walletBalance: {
          USD: Number(balance.USD) || 0,
          SYP: Number(balance.SYP) || 0,
        },
      }));
    } catch {
      // Keep UI stable if wallet API fails.
    }
  }, []);

  // Load dashboard data
  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        await loadWalletBalance();

        // Load shipments from API (all pages) to calculate accurate stats.
        const pageLimit = 100;
        let currentPage = 1;
        let totalPages = 1;
        let allShipments: any[] = [];
        let totalShipmentsCount = 0;

        while (currentPage <= totalPages) {
          const shipmentsResponse = await shipmentService.getUserShipments({
            page: currentPage,
            limit: pageLimit,
          });

          if (
            !shipmentsResponse.success ||
            !Array.isArray(shipmentsResponse.data)
          ) {
            break;
          }

          allShipments = [...allShipments, ...shipmentsResponse.data];
          totalPages = shipmentsResponse.pagination?.pages || 1;
          if (!totalShipmentsCount) {
            totalShipmentsCount = shipmentsResponse.pagination?.total || 0;
          }
          currentPage += 1;
        }

        const total = totalShipmentsCount || allShipments.length;
        const local = allShipments.filter(
          (s: any) => s.shippingType === "local",
        ).length;
        const international = allShipments.filter(
          (s: any) => s.shippingType === "international",
        ).length;
        const pending = allShipments.filter(
          (s: any) => s.status === "pending",
        ).length;
        const inTransit = allShipments.filter(
          (s: any) => s.status === "in-transit",
        ).length;
        const completed = allShipments.filter(
          (s: any) => s.status === "delivered",
        ).length;
        const cancelled = allShipments.filter(
          (s: any) => s.status === "cancelled",
        ).length;

        setStats((prev) => ({
          ...prev,
          totalShipments: total,
          localShipments: local,
          internationalShipments: international,
          pendingShipments: pending,
          inTransitShipments: inTransit,
          completedShipments: completed,
          cancelledShipments: cancelled,
        }));
      } catch (error: any) {
        console.error("Error loading dashboard data:", error);
        // Don't show error toast for empty state
        if (error.message && !error.message.includes("No shipments")) {
          toast.error(
            language === "ar"
              ? "حدث خطأ في تحميل البيانات"
              : "Error loading dashboard data",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, language, loadWalletBalance]);

  React.useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!userId) return;

    const apiBaseUrl = normalizeLocalApiUrl(
      import.meta.env.VITE_API_URL || "http://localhost:5001/api",
    );
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("wallet-updated", (payload: any) => {
      if (payload?.balance) {
        setStats((prev) => ({
          ...prev,
          walletBalance: {
            USD: Number(payload.balance.USD) || 0,
            SYP: Number(payload.balance.SYP) || 0,
          },
        }));
      } else {
        loadWalletBalance();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, loadWalletBalance]);

  const formatAmountUSD = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

    return `${formatted} $`;
  };

  const formatAmountSYP = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

    return `${formatted} ${language === "ar" ? "ل.س" : "SYP"}`;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-176px)] overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            {language === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-176px)] overflow-hidden bg-gray-50"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 h-full overflow-hidden">
        {/* Header - Mobile Optimized */}
        <div
          className={`text-center ${language === "ar" ? "sm:text-right" : "sm:text-left"}`}
        >
          {/* <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("dashboard.welcome")}
          </h1> */}
        </div>

        {/* Wallet Balance - Mobile First */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
                  <Wallet className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div
                  className={`flex-1 ${language === "ar" ? "text-right" : "text-left"}`}
                >
                  <h2 className="text-base sm:text-lg font-semibold mb-2">
                    {t("dashboard.walletBalance")}
                  </h2>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm opacity-90">
                        USD:
                      </span>
                      {showBalance ? (
                        <span className="text-lg sm:text-xl font-bold">
                          {formatAmountUSD(stats.walletBalance.USD)}
                        </span>
                      ) : (
                        <span className="text-lg sm:text-xl font-bold">
                          ••••••
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm opacity-90">
                        {language === "ar" ? "ل.س:" : "SYP:"}
                      </span>
                      {showBalance ? (
                        <span className="text-lg sm:text-xl font-bold">
                          {formatAmountSYP(stats.walletBalance.SYP)}
                        </span>
                      ) : (
                        <span className="text-lg sm:text-xl font-bold">
                          ••••••
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
                >
                  {showBalance ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Link to="/balance">
                  <Button
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100 min-h-[44px]"
                  >
                    <Plus
                      className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`}
                    />
                    <span className="hidden sm:inline">
                      {t("dashboard.chargeWallet")}
                    </span>
                    <span className="sm:hidden"> {t("balance.charge")}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile Responsive Grid (2 columns on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* All Statuses */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {language === "ar" ? "جميع الشحنات" : "All Shipments"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.totalShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {t("dashboard.pendingCount")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.pendingShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg sm:rounded-xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Transit Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {language === "ar" ? "قيد النقل" : "In Transit"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.inTransitShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg sm:rounded-xl">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {t("dashboard.deliveredCount")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.completedShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancelled Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {language === "ar" ? "الشحنات الملغاة" : "Cancelled"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.cancelledShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {language === "ar" ? "الشحنات المحلية" : "Local Shipments"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.localShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg sm:rounded-xl">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {language === "ar"
                      ? "الشحنات الدولية"
                      : "International Shipments"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.internationalShipments}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
