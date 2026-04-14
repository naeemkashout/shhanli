import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
}

export default function CompanyDetails() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
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
  }, [companyId, navigate]);

  const supportedCountries = useMemo(() => {
    if (!company) return [];
    if (!company.supportedCountries?.length) return ["جميع الدول المدعومة"];

    return company.supportedCountries.map((value) => {
      const country = getCountryByCode(value);
      return country?.name.ar || value;
    });
  }, [company]);

  const supportedStates = useMemo(() => {
    if (!company) return [];
    if (!company.supportedLocalStates?.length)
      return ["جميع المحافظات السورية"];

    return company.supportedLocalStates.map((value) => {
      const state = getStateByCode("SY", value);
      return state?.name.ar || value;
    });
  }, [company]);

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
          العودة إلى الشركات
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
              {company.description || "لا يوجد وصف متاح"}
            </p>

            <div className="flex flex-wrap gap-2">
              {company.supportsLocal && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> يدعم الشحن المحلي
                </Badge>
              )}
              {company.supportsInternational && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> يدعم الشحن الدولي
                </Badge>
              )}
              {company.codService?.enabled ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  الدفع عند الاستلام متاح
                </Badge>
              ) : (
                <Badge variant="outline">الدفع عند الاستلام غير متاح</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">سعر المحلي</div>
                <div className="text-gray-700">
                  {Number(company.pricing?.localPerKgSYP || 0).toLocaleString()}{" "}
                  ل.س / كغ
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">سعر الدولي</div>
                <div className="text-gray-700">
                  $
                  {Number(
                    company.pricing?.internationalPerKgUSD || 0,
                  ).toLocaleString()}{" "}
                  / كغ
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  معامل الوزن الحجمي
                </div>
                <div className="text-gray-700">
                  {company.volumetricDivisor || 6000}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  رسوم الدفع عند الاستلام
                </div>
                <div className="text-gray-700">
                  محلي:{" "}
                  {Number(
                    company.codService?.localFeeSYP || 0,
                  ).toLocaleString()}{" "}
                  ل.س | دولي: $
                  {Number(
                    company.codService?.internationalFeeUSD || 0,
                  ).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{company.email || "لا يوجد بريد إلكتروني"}</span>
              </div>
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{company.phone || "لا يوجد رقم هاتف"}</span>
              </div>
              <div className="p-3 border rounded-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{company.address || "لا يوجد عنوان"}</span>
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
                    <Globe className="w-4 h-4" /> الدول المدعومة
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
                    <Truck className="w-4 h-4" /> المحافظات المدعومة
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
              <Button
                onClick={handleCreateShipment}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 me-2" />
                إضافة شحنة عبر هذه الشركة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
