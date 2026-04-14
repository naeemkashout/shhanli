import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Globe, MapPin, Plus, ArrowRight } from "lucide-react";
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
}

export default function Companies() {
  const { isRTL, language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        const data = await shippingCompanyService.getShippingCompanies();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast.error(
          error.message ||
            tr("فشل تحميل شركات الشحن", "Failed to load shipping companies"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const getCountryLabel = (codeOrName: string) => {
    const country = getCountryByCode(codeOrName);
    return country?.name.ar || codeOrName;
  };

  const getStateLabel = (stateCodeOrName: string) => {
    const state = getStateByCode("SY", stateCodeOrName);
    return state?.name.ar || stateCodeOrName;
  };

  const visibleCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [companies]);

  const handleCreateShipment = (company: ShippingCompany) => {
    const preferredType = company.supportsLocal
      ? "local"
      : company.supportsInternational
        ? "international"
        : "local";

    navigate(
      `/create-shipment?companyId=${encodeURIComponent(company._id)}&shippingType=${preferredType}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {tr("شركات الشحن", "Shipping Companies")}
          </h1>
          <p className="text-gray-600 mt-2">
            {tr(
              "اختر شركة الشحن المناسبة ثم اطلع على تفاصيل التغطية والأسعار قبل إنشاء الشحنة.",
              "Choose the right shipping company and review coverage and pricing details before creating your shipment.",
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-10 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : visibleCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-600">
              {tr(
                "لا توجد شركات شحن متاحة حاليا.",
                "No shipping companies are currently available.",
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleCompanies.map((company) => (
              <Card key={company._id} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-10 w-10 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-500" />
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
                  <p className="text-sm text-gray-600 line-clamp-2 min-h-10">
                    {company.description ||
                      tr(
                        "شركة شحن معتمدة ضمن المنصة",
                        "A verified shipping company on the platform",
                      )}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {company.supportsLocal && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" /> {tr("محلي", "Local")}
                      </Badge>
                    )}
                    {company.supportsInternational && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" />{" "}
                        {tr("دولي", "International")}
                      </Badge>
                    )}
                    {company.codService?.enabled && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        {tr(
                          "الدفع عند الاستلام متاح",
                          "Cash on delivery available",
                        )}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      {tr("الدول", "Countries")}:{" "}
                      {company.supportedCountries?.length
                        ? company.supportedCountries
                            .slice(0, 3)
                            .map(getCountryLabel)
                            .join(" - ")
                        : tr("جميع الدول", "All countries")}
                    </div>
                    {company.supportedLocalStates?.length ? (
                      <div>
                        {tr("المحافظات", "States")}:{" "}
                        {company.supportedLocalStates
                          .slice(0, 3)
                          .map(getStateLabel)
                          .join(" - ")}
                        {company.supportedLocalStates.length > 3
                          ? ` +${company.supportedLocalStates.length - 3}`
                          : ""}
                      </div>
                    ) : (
                      <div>
                        {tr(
                          "المحافظات: جميع المحافظات السورية",
                          "States: All Syrian states",
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/companies/${company._id}`)}
                    >
                      {tr("التفاصيل", "Details")}
                      <ArrowRight className="w-4 h-4 ms-2" />
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => handleCreateShipment(company)}
                    >
                      <Plus className="w-4 h-4 me-2" />
                      {tr("إضافة شحنة", "Create Shipment")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
