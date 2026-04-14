import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  CheckCircle,
  Plus,
  Users,
  ArrowRight,
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
  const [recentShipments, setRecentShipments] = React.useState<any[]>([]);
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

        setRecentShipments(allShipments.slice(0, 5));

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

    socket.on("new-notification", (notification: any) => {
      if (notification?.type === "wallet") {
        loadWalletBalance();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, loadWalletBalance]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-700 bg-amber-100";
      case "confirmed":
        return "text-sky-700 bg-sky-100";
      case "picked-up":
        return "text-violet-700 bg-violet-100";
      case "in-transit":
        return "text-blue-600 bg-blue-100";
      case "out-for-delivery":
        return "text-fuchsia-700 bg-fuchsia-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      case "returned":
        return "text-slate-700 bg-slate-200";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SY" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div
          className={`text-center ${language === "ar" ? "sm:text-right" : "sm:text-left"}`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("dashboard.welcome")}
          </h1>
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

        {/* Stats Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* Main Content Grid - Mobile Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Shipments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">
                {t("dashboard.recentShipmentsTitle")}
              </CardTitle>
              <Link to="/shipments">
                <Button variant="outline" size="sm" className="min-h-[44px]">
                  <span className="hidden sm:inline">
                    {t("dashboard.viewAllShipments")}
                  </span>
                  <span className="sm:hidden">
                    {language === "ar" ? "عرض الكل" : "View All"}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 ${language === "ar" ? "mr-2" : "ml-2"}`}
                  />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {recentShipments.length > 0 ? (
                  recentShipments.map((shipment) => (
                    <div
                      key={shipment._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {shipment.trackingNumber}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {language === "ar"
                              ? `من ${shipment.sender.name} إلى ${shipment.receivers[0]?.name}`
                              : `From ${shipment.sender.name} to ${shipment.receivers[0]?.name}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(shipment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center flex-shrink-0 min-w-[110px]">
                        <span
                          className={`inline-flex items-center justify-center min-w-[92px] px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            shipment.status,
                          )}`}
                        >
                          {t(`status.${shipment.status}`)}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1 text-center">
                          {shipment.cost.currency === "USD"
                            ? formatAmountUSD(shipment.cost.amount)
                            : formatAmountSYP(shipment.cost.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {t("dashboard.noShipments")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">
                {t("dashboard.quickActionsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                <Link to="/create-shipment">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer min-h-[60px]">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {t("dashboard.createNewShipment")}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.startNewShipment")}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>

                <Link to="/shipments">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer min-h-[60px]">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {t("dashboard.viewAllShipments")}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.viewAllShipmentsDesc")}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>

                <Link to="/contacts">
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer min-h-[60px]">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {t("dashboard.sendersReceivers")}
                      </h3>
                      <p className="text-xs text-gray-600">
                        إدارة جهات الاتصال
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
