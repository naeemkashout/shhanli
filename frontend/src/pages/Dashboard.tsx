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
import { Link } from "react-router-dom";
import shipmentService from "@/services/shipmentService";
import walletService from "@/services/walletService";
import shippingCompanyService from "@/services/shippingCompanyService";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

type DashboardOffer = {
  _id?: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaTextEn?: string;
  ctaLink?: string;
  background?: string;
  localPrice?: number;
  localPriceSYP?: number;
  localPriceUSD?: number;
  internationalPrice?: number;
  internationalPriceSYP?: number;
  internationalPriceUSD?: number;
  codFeeSYP?: number;
  codFeeUSD?: number;
  expressFeeSYP?: number;
  expressFeeUSD?: number;
  packagingFeeSYP?: number;
  packagingFeeUSD?: number;
  durationDays?: number;
  durationHours?: number;
  priority?: number;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
  companyName?: string;
};

type DashboardCompany = {
  _id: string;
  name: string;
  offers?: DashboardOffer[];
};

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
  const [offers, setOffers] = React.useState<DashboardOffer[]>([]);
  const [activeOfferIndex, setActiveOfferIndex] = React.useState(0);

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

  React.useEffect(() => {
    const loadOffers = async () => {
      try {
        const companies =
          (await shippingCompanyService.getShippingCompanies()) as DashboardCompany[];

        const now = Date.now();
        const nextOffers = (companies || [])
          .flatMap((company) =>
            (company.offers || []).map((offer) => ({
              ...offer,
              companyName: company.name,
            })),
          )
          .filter((offer) => {
            if (!offer?.isActive) return false;
            if (!String(offer.title || offer.titleEn || "").trim()) return false;

            const startAt = offer.startAt
              ? new Date(offer.startAt).getTime()
              : null;
            const endAt = offer.endAt ? new Date(offer.endAt).getTime() : null;

            if (startAt && !Number.isNaN(startAt) && startAt > now) return false;
            if (endAt && !Number.isNaN(endAt) && endAt < now) return false;
            return true;
          })
          .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

        setOffers(nextOffers);
        setActiveOfferIndex(0);
      } catch {
        setOffers([]);
      }
    };

    loadOffers();
  }, []);

  React.useEffect(() => {
    if (offers.length < 2) return;

    const timer = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % offers.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [offers.length]);

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

  const formatAmountUSDNoSymbol = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

    return `${formatted} $`;
  };

  const activeOffer = offers[activeOfferIndex] || null;

  const previousOffer = offers.length
    ? offers[(activeOfferIndex - 1 + offers.length) % offers.length]
    : null;
  const nextOffer = offers.length
    ? offers[(activeOfferIndex + 1) % offers.length]
    : null;

  const getOfferText = (
    offer: DashboardOffer,
    field: "title" | "subtitle" | "ctaText",
  ) => {
    const englishField = `${field}En` as "titleEn" | "subtitleEn" | "ctaTextEn";
    const primary =
      language === "ar"
        ? String(offer[field] || "").trim()
        : String(offer[englishField] || "").trim();
    const fallback =
      language === "ar"
        ? String(offer[englishField] || "").trim()
        : String(offer[field] || "").trim();

    return primary || fallback;
  };

  const getOfferDescription = (offer: DashboardOffer) => {
    const primary =
      language === "ar"
        ? String(offer.description || "").trim()
        : String(offer.descriptionEn || "").trim();
    const fallback =
      language === "ar"
        ? String(offer.descriptionEn || "").trim()
        : String(offer.description || "").trim();

    return primary || fallback;
  };

  const offerPriceItems = (offer: DashboardOffer) => [
    {
      label: language === "ar" ? "السعر المحلي" : "Local price",
      value:
        Number(offer.localPriceSYP || offer.localPrice || 0) > 0
          ? formatAmountSYP(Number(offer.localPriceSYP || offer.localPrice || 0))
          : offer.localPriceUSD
            ? formatAmountUSDNoSymbol(Number(offer.localPriceUSD))
            : null,
    },
    {
      label: language === "ar" ? "السعر الدولي" : "International price",
      value:
        Number(offer.internationalPriceUSD || offer.internationalPrice || 0) > 0
          ? formatAmountUSDNoSymbol(
              Number(offer.internationalPriceUSD || offer.internationalPrice || 0),
            )
          : offer.internationalPriceSYP
            ? formatAmountSYP(Number(offer.internationalPriceSYP))
            : null,
    },
    {
      label: "COD",
      value:
        Number(offer.codFeeSYP || offer.codFeeUSD || 0) > 0
          ? `${formatAmountSYP(Number(offer.codFeeSYP || 0))} | ${formatAmountUSDNoSymbol(Number(offer.codFeeUSD || 0))}`
          : null,
    },
    {
      label: language === "ar" ? "السريع" : "Express",
      value:
        Number(offer.expressFeeSYP || offer.expressFeeUSD || 0) > 0
          ? `${formatAmountSYP(Number(offer.expressFeeSYP || 0))} | ${formatAmountUSDNoSymbol(Number(offer.expressFeeUSD || 0))}`
          : null,
    },
    {
      label: language === "ar" ? "التغليف" : "Packaging",
      value:
        Number(offer.packagingFeeSYP || offer.packagingFeeUSD || 0) > 0
          ? `${formatAmountSYP(Number(offer.packagingFeeSYP || 0))} | ${formatAmountUSDNoSymbol(Number(offer.packagingFeeUSD || 0))}`
          : null,
    },
    {
      label: language === "ar" ? "المدة" : "Duration",
      value:
        Number(offer.durationDays || 0) > 0 || Number(offer.durationHours || 0) > 0
          ? [
              Number(offer.durationDays || 0) > 0
                ? `${Number(offer.durationDays)} ${language === "ar" ? "يوم" : "day"}`
                : null,
              Number(offer.durationHours || 0) > 0
                ? `${Number(offer.durationHours)} ${language === "ar" ? "ساعة" : "hour"}`
                : null,
            ]
              .filter(Boolean)
              .join(" + ")
          : null,
    },
  ].filter((item) => Boolean(item.value));

  const moveOffer = (direction: "next" | "prev") => {
    if (!offers.length) return;

    setActiveOfferIndex((prev) => {
      if (direction === "next") {
        return (prev + 1) % offers.length;
      }
      return (prev - 1 + offers.length) % offers.length;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen overflow-y-auto bg-gray-50 flex items-center justify-center lg:h-screen lg:overflow-hidden">
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
      className="min-h-screen overflow-y-auto bg-gray-50 lg:h-screen lg:overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:h-full lg:overflow-hidden">
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

        {activeOffer ? (
          <>
            <div className="flex items-center justify-between -mt-1 sm:-mt-2 mb-1 px-1">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {language === "ar" ? "العروض" : "Offers"}
              </h2>
              <Link to="/offers">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-blue-700 hover:text-blue-900"
                >
                  {language === "ar" ? "عرض الكل" : "View All"}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_260px] items-stretch">
              <button
                type="button"
                onClick={() => moveOffer("prev")}
                className="hidden lg:block overflow-hidden rounded-3xl border border-slate-200/70 bg-transparent shadow-none cursor-pointer"
                aria-label={language === "ar" ? "العرض السابق" : "Previous offer"}
              >
                {previousOffer?.imageUrl ? (
                  <img
                    src={previousOffer.imageUrl}
                    alt={getOfferText(previousOffer, "title") || "Offer"}
                    className="h-full min-h-[280px] w-full object-cover opacity-90 transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="relative flex h-full min-h-[280px] w-full flex-col justify-end overflow-hidden p-5 text-white"
                    style={{
                      background:
                        previousOffer?.background ||
                        "linear-gradient(135deg, #1e293b 0%, #334155 55%, #0f766e 100%)",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 space-y-3">
                      <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {previousOffer?.companyName ||
                          (language === "ar" ? "شركة شحن" : "Shipping Company")}
                      </p>
                      <div>
                        <h3 className="text-lg font-bold leading-tight line-clamp-2">
                          {getOfferText(previousOffer, "title")}
                        </h3>
                        {getOfferText(previousOffer, "subtitle") ? (
                          <p className="mt-1 text-xs text-white/85 line-clamp-2">
                            {getOfferText(previousOffer, "subtitle")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                          {language === "ar" ? "محلي" : "Local"}: {formatAmountSYP(Number(previousOffer?.localPriceSYP ?? previousOffer?.localPrice ?? 0))}
                        </span>
                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                          {language === "ar" ? "دولي" : "International"}: {formatAmountUSD(Number(previousOffer?.internationalPriceUSD ?? previousOffer?.internationalPrice ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>

              <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                <div
                  key={`${activeOffer._id || activeOfferIndex}`}
                    className="relative min-h-[240px] sm:min-h-[280px] animate-in fade-in slide-in-from-bottom-3 duration-500"
                  style={
                    activeOffer.imageUrl
                      ? undefined
                      : {
                          background:
                            activeOffer.background ||
                            "linear-gradient(120deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
                        }
                  }
                >
                  {activeOffer.imageUrl ? (
                    <img
                      src={activeOffer.imageUrl}
                      alt={getOfferText(activeOffer, "title") || "Offer"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/20 blur-3xl animate-pulse" />
                      <div className="absolute -bottom-8 -right-6 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
                    </>
                  )}

                  <div className="absolute inset-0 bg-black/35" />

                  <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-4 sm:p-6 text-white">
                    <p className="inline-flex w-fit items-center rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      {activeOffer.companyName ||
                        (language === "ar" ? "شركة شحن" : "Shipping Company")}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold leading-tight line-clamp-2">
                      {getOfferText(activeOffer, "title")}
                    </h3>
                    {getOfferText(activeOffer, "subtitle") ? (
                      <p className="text-sm sm:text-base text-white/90 line-clamp-2">
                        {getOfferText(activeOffer, "subtitle")}
                      </p>
                    ) : null}

                    {getOfferDescription(activeOffer) ? (
                      <p className="text-sm sm:text-base text-white/85 line-clamp-3 leading-6">
                        {getOfferDescription(activeOffer)}
                      </p>
                    ) : null}

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {offerPriceItems(activeOffer).map((item) => (
                        <div
                          key={`${activeOffer._id || activeOfferIndex}-${item.label}`}
                          className="rounded-2xl bg-white/15 px-3 py-2 text-xs sm:text-sm font-medium backdrop-blur-sm"
                        >
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                            {item.label}
                          </div>
                          <div className="mt-1 text-sm text-white">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2" />
                    </div>

                    {offers.length > 1 ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        {offers.map((_, index) => (
                          <button
                            key={`dashboard-offer-${index}`}
                            type="button"
                            onClick={() => setActiveOfferIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              index === activeOfferIndex
                                ? "w-6 bg-white"
                                : "w-2 bg-white/60 hover:bg-white/90"
                            }`}
                            aria-label={`Offer ${index + 1}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>

              <button
                type="button"
                onClick={() => moveOffer("next")}
                className="hidden lg:block overflow-hidden rounded-3xl border border-slate-200/70 bg-transparent shadow-none cursor-pointer"
                aria-label={language === "ar" ? "العرض التالي" : "Next offer"}
              >
                {nextOffer?.imageUrl ? (
                  <img
                    src={nextOffer.imageUrl}
                    alt={getOfferText(nextOffer, "title") || "Offer"}
                    className="h-full min-h-[280px] w-full object-cover opacity-90 transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="relative flex h-full min-h-[280px] w-full flex-col justify-end overflow-hidden p-5 text-white"
                    style={{
                      background:
                        nextOffer?.background ||
                        "linear-gradient(135deg, #1e293b 0%, #334155 55%, #0f766e 100%)",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 space-y-3">
                      <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {nextOffer?.companyName ||
                          (language === "ar" ? "شركة شحن" : "Shipping Company")}
                      </p>
                      <div>
                        <h3 className="text-lg font-bold leading-tight line-clamp-2">
                          {getOfferText(nextOffer, "title")}
                        </h3>
                        {getOfferText(nextOffer, "subtitle") ? (
                          <p className="mt-1 text-xs text-white/85 line-clamp-2">
                            {getOfferText(nextOffer, "subtitle")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                          {language === "ar" ? "محلي" : "Local"}: {formatAmountSYP(Number(nextOffer?.localPriceSYP ?? nextOffer?.localPrice ?? 0))}
                        </span>
                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                          {language === "ar" ? "دولي" : "International"}: {formatAmountUSD(Number(nextOffer?.internationalPriceUSD ?? nextOffer?.internationalPrice ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </>
        ) : null}

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
      </div>
    </div>
  );
}
