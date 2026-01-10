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
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();

  const [showBalance, setShowBalance] = React.useState(true);

  // Mock data
  const stats = {
    totalShipments: 156,
    pendingShipments: 23,
    completedShipments: 133,
    walletBalance: {
      USD: 1250.75,
      SYP: 2850000,
    },
  };

  const recentShipments = [
    {
      id: "SH001",
      from: "دمشق",
      to: "حلب",
      status: "delivered",
      date: "2024-01-15",
      cost: 25000,
    },
    {
      id: "SH002",
      from: "اللاذقية",
      to: "دمشق",
      status: "in-transit",
      date: "2024-01-14",
      cost: 30000,
    },
    {
      id: "SH003",
      from: "حمص",
      to: "حماة",
      status: "pending",
      date: "2024-01-13",
      cost: 15000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-100";
      case "in-transit":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatAmountUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatAmountSYP = (amount: number) => {
    return (
      new Intl.NumberFormat(isRTL ? "ar-SY" : "en-US").format(amount) +
      " " +
      t("currency.syp")
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="text-center sm:text-right">
          <h1
            className={`
    text-2xl sm:text-3xl font-bold text-gray-900
    ${language === "ar" ? "text-right" : "text-left"}
  `}
          >
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
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-semibold mb-2">
                    {t("dashboard.walletBalance")}
                  </h2>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 sm:gap-3">
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
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm opacity-90">
                        SYP:
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
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
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
                    <Plus className="w-4 h-4 mr-2" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Shipments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {t("dashboard.totalShipmentsCount")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.totalShipments}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +12% {t("dashboard.monthlyGrowth")}
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
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +5% {t("dashboard.monthlyGrowth")}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg sm:rounded-xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Shipments */}
          <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {t("dashboard.deliveredCount")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.completedShipments}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +18% {t("dashboard.monthlyGrowth")}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
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
                  <span className="sm:hidden">عرض الكل</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {recentShipments.length > 0 ? (
                  recentShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {shipment.id}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {t("shipments.fromTo", {
                              from: shipment.from,
                              to: shipment.to,
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {shipment.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            shipment.status
                          )}`}
                        >
                          {t(`status.${shipment.status}`)}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatAmountSYP(shipment.cost)}
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
