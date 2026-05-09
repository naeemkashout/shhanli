import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Truck,
  ExternalLink,
  Tag,
  Clock3,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import shippingCompanyService from "@/services/shippingCompanyService";
import { getCountryByCode, getStateByCode } from "@/data/globalLocations";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShippingCompany {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  trackingUrlTemplate?: string;
  supportedCountries: string[];
  supportedLocalStates?: string[];
  supportsLocal: boolean;
  supportsInternational: boolean;
  pricing: {
    localPerKgSYP: number;
    internationalPerKgUSD: number;
  };
  volumetricDivisor?: number;
  codService?: {
    enabled: boolean;
    localFeeSYP: number;
    internationalFeeUSD: number;
  };
  expressService?: {
    enabled: boolean;
    localFeeSYP: number;
    internationalFeeUSD: number;
  };
  offers?: Array<{
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
    codFee?: number;
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
  }>;
}

export default function CompanyDetails() {
  const { isRTL, language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = useParams();
  const [company, setCompany] = useState<ShippingCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await shippingCompanyService.getShippingCompanies();
        const matched = (Array.isArray(data) ? data : []).find(
          (item: ShippingCompany) => item._id === companyId,
        );

        if (!matched) {
          toast.error(
            isRTL
              ? "لم يتم العثور على الشركة المطلوبة"
              : "Requested company was not found",
          );
          navigate("/companies");
          return;
        }

        setCompany(matched);
      } catch (error: any) {
        toast.error(
          error.message ||
            (isRTL
              ? "فشل تحميل معلومات الشركة"
              : "Failed to load company details"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, [companyId, navigate, isRTL]);

  const supportedCountries = useMemo(() => {
    if (!company) return [];
    if (!company.supportedCountries?.length)
      return [tr("جميع الدول المدعومة", "All supported countries")];

    return company.supportedCountries.map((value) => {
      const country = getCountryByCode(value);
      if (!country) return value;
      return language === "ar" ? country.name.ar : country.name.en;
    });
  }, [company, language]);

  const supportedStates = useMemo(() => {
    if (!company) return [];
    if (!company.supportedLocalStates?.length)
      return [tr("جميع المحافظات السورية", "All Syrian states")];

    return company.supportedLocalStates.map((value) => {
      const state = getStateByCode("SY", value);
      if (!state) return value;
      return language === "ar" ? state.name.ar : state.name.en;
    });
  }, [company, language]);

  const activeOffers = useMemo(() => {
    if (!company?.offers?.length) return [];

    const now = Date.now();
    return company.offers
      .filter((offer) => {
        if ((!offer?.title && !offer?.titleEn) || !offer?.isActive)
          return false;
        const start = offer.startAt ? new Date(offer.startAt).getTime() : null;
        const end = offer.endAt ? new Date(offer.endAt).getTime() : null;
        if (start && !Number.isNaN(start) && start > now) return false;
        if (end && !Number.isNaN(end) && end < now) return false;
        return true;
      })
      .sort(
        (left, right) =>
          Number(right.priority || 0) - Number(left.priority || 0),
      );
  }, [company]);

  useEffect(() => {
    if (!company || location.hash !== "#offers") return;

    const timer = window.setTimeout(() => {
      document.getElementById("company-offers")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [company, location.hash]);

  const handleCreateShipment = () => {
    if (!company) return;

    const preferredType = company.supportsLocal
      ? "local"
      : company.supportsInternational
        ? "international"
        : "local";

    navigate(
      `/create-shipment?companyId=${encodeURIComponent(company._id)}&shippingType=${preferredType}`,
    );
  };

  const handleOpenOffer = () => {
    if (!company) return;
    navigate(`/companies/${company._id}#offers`);
  };

  const handleCreateShipmentFromOffer = (offerId?: string) => {
    if (!company) return;

    const params = new URLSearchParams({
      companyId: company._id,
      offerOnly: "1",
    });

    if (offerId) {
      params.set("offerId", offerId);
    }

    navigate(`/create-shipment?${params.toString()}`);
  };

  const getOfferAmount = (primary?: number, fallback?: number) =>
    Number(primary ?? fallback ?? 0);

  const getOfferText = (
    offer: NonNullable<ShippingCompany["offers"]>[number],
    field: "title" | "subtitle" | "description" | "ctaText",
  ) => {
    const englishField = `${field}En` as
      | "titleEn"
      | "subtitleEn"
      | "descriptionEn"
      | "ctaTextEn";
    const primary =
      language === "en"
        ? String(offer[englishField] || "").trim()
        : String(offer[field] || "").trim();
    const fallback =
      language === "en"
        ? String(offer[field] || "").trim()
        : String(offer[englishField] || "").trim();

    return primary || fallback;
  };

  const formatOfferDuration = (offer: {
    durationDays?: number;
    durationHours?: number;
  }) => {
    const days = Number(offer.durationDays || 0);
    const hours = Number(offer.durationHours || 0);
    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} ${tr("يوم", "day")}`);
    }

    if (hours > 0) {
      parts.push(`${hours} ${tr("ساعة", "hour")}`);
    }

    return parts.length > 0 ? parts.join(" + ") : tr("غير محددة", "Not set");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <Card className="animate-pulse">
            <CardContent className="p-8 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/companies")}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {tr("العودة إلى الشركات", "Back to companies")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex flex-wrap items-center gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-12 w-12 rounded-full border object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div>
                <div>{company.name}</div>
                <div className="text-xs text-gray-500 font-normal">
                  {company.code}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              {company.description ||
                tr("لا يوجد وصف متاح", "No description available")}
            </p>

            <div className="flex flex-wrap gap-2">
              {company.supportsLocal && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{" "}
                  {tr("يدعم الشحن المحلي", "Supports local shipping")}
                </Badge>
              )}
              {company.supportsInternational && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />{" "}
                  {tr("يدعم الشحن الدولي", "Supports international shipping")}
                </Badge>
              )}
              {company.codService?.enabled ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {tr("الدفع عند الاستلام متاح", "Cash on delivery available")}
                </Badge>
              ) : (
                <Badge variant="outline">
                  {tr(
                    "الدفع عند الاستلام: لا يوجد",
                    "Cash on delivery: Not available",
                  )}
                </Badge>
              )}
              {company.expressService?.enabled ? (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  {tr("الشحن السريع متاح", "Express shipping available")}
                </Badge>
              ) : (
                <Badge variant="outline">
                  {tr(
                    "الشحن السريع: لا يوجد",
                    "Express shipping: Not available",
                  )}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {tr("سعر المحلي", "Local price")}
                </div>
                <div className="text-gray-700">
                  {Number(company.pricing?.localPerKgSYP || 0).toLocaleString()}{" "}
                  {tr("ل.س / كغ", "SYP / kg")}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {tr("سعر الدولي", "International price")}
                </div>
                <div className="text-gray-700">
                  $
                  {Number(
                    company.pricing?.internationalPerKgUSD || 0,
                  ).toLocaleString()}{" "}
                  {tr("/ كغ", "/ kg")}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {tr("معامل الوزن الحجمي", "Volumetric divisor")}
                </div>
                <div className="text-gray-700">
                  {company.volumetricDivisor || 6000}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {tr("الدفع عند الاستلام", "Cash on delivery")}
                </div>
                <div className="text-gray-700">
                  {company.codService?.enabled
                    ? tr("متاح", "Available")
                    : tr("لا يوجد", "Not available")}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {tr("الشحن السريع", "Express shipping")}
                </div>
                <div className="text-gray-700">
                  {company.expressService?.enabled
                    ? tr("متاح", "Available")
                    : tr("لا يوجد", "Not available")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>
                  {company.email || tr("لا يوجد بريد إلكتروني", "No email")}
                </span>
              </div>
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>
                  {company.phone || tr("لا يوجد رقم هاتف", "No phone number")}
                </span>
              </div>
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>
                  {company.address || tr("لا يوجد عنوان", "No address")}
                </span>
              </div>
            </div>

            {/* {company.trackingUrlTemplate && (
              <a
                href={company.trackingUrlTemplate}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-blue-700 text-sm hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                رابط تتبع الشركة
              </a>
            )} */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4" />{" "}
                    {tr("الدول المدعومة", "Supported countries")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supportedCountries.map((country) => (
                      <Badge key={country} variant="outline">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4" />{" "}
                    {tr("المحافظات المدعومة", "Supported states")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supportedStates.map((state) => (
                      <Badge key={state} variant="outline">
                        {state}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-2">
              <div className="flex flex-wrap gap-3">
                {activeOffers.length > 0 ? (
                  <Button variant="outline" onClick={handleOpenOffer}>
                    <Tag className="w-4 h-4 me-2" />
                    {tr("عرض العروض", "View offers")}
                  </Button>
                ) : null}
                <Button
                  onClick={handleCreateShipment}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 me-2" />
                  {tr(
                    "إضافة شحنة عبر هذه الشركة",
                    "Create shipment with this company",
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeOffers.length > 0 ? (
          <Card id="company-offers">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {tr("عروض الشركة", "Company offers")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeOffers.map((offer, index) => (
                <div
                  key={`${offer.title || offer.titleEn || "offer"}-${index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={getOfferText(offer, "title") || company.name}
                      className="h-52 w-full object-cover"
                    />
                  ) : null}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {getOfferText(offer, "title")}
                        </h3>
                        {getOfferText(offer, "subtitle") ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {getOfferText(offer, "subtitle")}
                          </p>
                        ) : null}
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {tr("عرض", "Offer")} #{index + 1}
                      </Badge>
                    </div>

                    {getOfferText(offer, "description") ? (
                      <p className="text-sm leading-7 text-slate-600">
                        {getOfferText(offer, "description")}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="font-medium text-slate-900">
                          {tr("الشحن المحلي", "Local shipping")}
                        </div>
                        <div className="mt-1 text-slate-600">
                          {getOfferAmount(
                            offer.localPriceSYP,
                            offer.localPrice,
                          ).toLocaleString()}{" "}
                          {tr("ل.س", "SYP")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tr("المحلي = ليرة سورية", "Local = SYP")}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="font-medium text-slate-900">
                          {tr("الشحن الدولي", "International shipping")}
                        </div>
                        <div className="mt-1 text-slate-600">
                          $
                          {getOfferAmount(
                            offer.internationalPriceUSD,
                            offer.internationalPrice,
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tr("الدولي = دولار", "International = USD")}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="font-medium text-slate-900">
                          {tr("رسوم COD", "COD fee")}
                        </div>
                        <div className="mt-1 text-slate-600">
                          {getOfferAmount(
                            offer.codFeeSYP,
                            offer.codFee,
                          ).toLocaleString()}{" "}
                          {tr("ل.س", "SYP")}
                        </div>
                        <div className="text-xs text-slate-500">
                          ${getOfferAmount(offer.codFeeUSD).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="font-medium text-slate-900">
                          {tr("الشحن السريع", "Express shipping")}
                        </div>
                        <div className="mt-1 text-slate-600">
                          {getOfferAmount(offer.expressFeeSYP).toLocaleString()}{" "}
                          {tr("ل.س", "SYP")}
                        </div>
                        <div className="text-xs text-slate-500">
                          $
                          {getOfferAmount(offer.expressFeeUSD).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="font-medium text-slate-900">
                          {tr("التغليف", "Packaging")}
                        </div>
                        <div className="mt-1 text-slate-600">
                          {getOfferAmount(
                            offer.packagingFeeSYP,
                          ).toLocaleString()}{" "}
                          {tr("ل.س", "SYP")}
                        </div>
                        <div className="text-xs text-slate-500">
                          $
                          {getOfferAmount(
                            offer.packagingFeeUSD,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {offer.durationDays || offer.durationHours ? (
                        <div className="inline-flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" />
                          {tr("مدة العرض", "Offer duration")}{" "}
                          {formatOfferDuration(offer)}
                        </div>
                      ) : null}
                      {getOfferAmount(offer.codFeeSYP, offer.codFee) > 0 ? (
                        <div className="inline-flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          {tr(
                            "يشمل الدفع عند الاستلام",
                            "Includes cash on delivery",
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleCreateShipmentFromOffer(offer._id)}
                      >
                        <Plus className="w-4 h-4 me-2" />
                        {getOfferText(offer, "ctaText") ||
                          tr("الاستفادة من العرض", "Use this offer")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
