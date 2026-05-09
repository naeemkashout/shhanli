import React, { useEffect, useState } from "react";
import {
  Building2,
  Edit,
  KeyRound,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GlobalCountrySelector } from "@/components/GlobalCountrySelector";
import { SearchableStateSelector } from "@/components/SearchableStateSelector";
import {
  getAllCountries,
  getCountryByCode,
  getStateByCode,
  getStatesByCountry,
  GlobalCountry,
  GlobalState,
} from "@/data/globalLocations";

const createEmptyOffer = () => ({
  title: "",
  titleEn: "",
  subtitle: "",
  subtitleEn: "",
  description: "",
  descriptionEn: "",
  imageUrl: "",
  ctaText: "",
  ctaTextEn: "",
  ctaLink: "",
  background: "",
  startAt: "",
  endAt: "",
  localPriceSYP: 0,
  localPriceUSD: 0,
  internationalPriceSYP: 0,
  internationalPriceUSD: 0,
  codFeeSYP: 0,
  codFeeUSD: 0,
  expressFeeSYP: 0,
  expressFeeUSD: 0,
  durationDays: 0,
  durationHours: 0,
  packagingFeeSYP: 0,
  packagingFeeUSD: 0,
});

const emptyForm = {
  name: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  logoUrl: "",
  trackingUrlTemplate: "",
  supportedCountries: [] as string[],
  supportedLocalStates: [] as string[],
  supportsLocal: true,
  supportsInternational: true,
  localPerKgSYP: 0,
  internationalPerKgUSD: 0,
  internationalZoneRates: [
    { zone: "A", minWeight: 0, maxWeight: 0, perKgUSD: 0 },
  ],
  internationalCountryZones: {} as Record<string, string>,
  offers: [createEmptyOffer()],
  volumetricDivisor: 6000,
  codEnabled: false,
  codLocalFeeSYP: 0,
  codInternationalFeeUSD: 0,
  expressEnabled: false,
  expressLocalFeeSYP: 0,
  expressInternationalFeeUSD: 0,
  packagingEnabled: false,
  packagingLocalFeeSYP: 0,
  packagingInternationalFeeUSD: 0,
  isActive: true,
};

export default function CompaniesManagement() {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company-admin";
  const language = (localStorage.getItem("language") as "ar" | "en") || "ar";
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadingOfferIndex, setUploadingOfferIndex] = useState<number | null>(
    null,
  );
  const [isOffersDialogOpen, setIsOffersDialogOpen] = useState(false);
  const [accountCompany, setAccountCompany] = useState<any>(null);
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    resetPassword: false,
  });
  const [selectedInternationalCountry, setSelectedInternationalCountry] =
    useState("SY");
  const [selectedLocalState, setSelectedLocalState] = useState("DAM");
  const [includeAllCountries, setIncludeAllCountries] = useState(true);
  const [includeAllLocalStates, setIncludeAllLocalStates] = useState(true);
  const [selectedZoneCountry, setSelectedZoneCountry] = useState("SY");
  const [selectedZoneCode, setSelectedZoneCode] = useState("A");

  const formatOfferDurationLabel = (offer: {
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

  const getOfferTargetCompanyId = () => {
    const selectedCompanyId = selectedCompany?._id
      ? String(selectedCompany._id)
      : "";
    const loadedCompanyId = companies[0]?._id ? String(companies[0]._id) : "";
    const userCompanyId =
      typeof user?.shippingCompanyId === "string"
        ? user.shippingCompanyId
        : user?.shippingCompanyId?._id || "";

    return selectedCompanyId || loadedCompanyId || userCompanyId;
  };

  const allCountries = getAllCountries();
  const syrianStates = getStatesByCountry("SY");

  const normalizeCountryCode = (value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "";

    if (/^[A-Za-z]{2}$/.test(normalized)) {
      return normalized.toUpperCase();
    }

    const lowered = normalized.toLowerCase();
    const matchedCountry = allCountries.find(
      (country) =>
        country.name.ar.toLowerCase() === lowered ||
        country.name.en.toLowerCase() === lowered,
    );

    return matchedCountry?.code || "";
  };

  const normalizeStateCode = (value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "";

    if (
      /^[A-Za-z0-9-]{2,10}$/.test(normalized) &&
      normalized === normalized.toUpperCase()
    ) {
      const exists = syrianStates.some((state) => state.code === normalized);
      if (exists) return normalized;
    }

    const lowered = normalized.toLowerCase();
    const matchedState = syrianStates.find(
      (state) =>
        state.name.ar.toLowerCase() === lowered ||
        state.name.en.toLowerCase() === lowered,
    );

    return matchedState?.code || "";
  };

  const normalizeZoneCode = (value: string) =>
    String(value || "")
      .trim()
      .toUpperCase();

  const getAvailableZoneCodes = () => {
    const fromRates = formData.internationalZoneRates
      .map((rate) => normalizeZoneCode(rate.zone))
      .filter(Boolean);

    return Array.from(new Set(fromRates));
  };

  const addZoneRate = () => {
    const existingCodes = getAvailableZoneCodes();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nextZone = "A";

    for (const letter of alphabet) {
      if (!existingCodes.includes(letter)) {
        nextZone = letter;
        break;
      }
    }

    setFormData((prev) => ({
      ...prev,
      internationalZoneRates: [
        ...prev.internationalZoneRates,
        { zone: nextZone, minWeight: 0, maxWeight: 0, perKgUSD: 0 },
      ],
    }));
    setSelectedZoneCode(nextZone);
  };

  const updateZoneRate = (
    index: number,
    field: "zone" | "minWeight" | "maxWeight" | "perKgUSD",
    value: string,
  ) => {
    setFormData((prev) => {
      const nextRates = prev.internationalZoneRates.map((rate, idx) => {
        if (idx !== index) return rate;
        if (field === "zone") {
          return {
            ...rate,
            zone: normalizeZoneCode(value),
          };
        }

        if (field === "minWeight" || field === "maxWeight") {
          return {
            ...rate,
            [field]: Math.max(0, Number(value) || 0),
          };
        }

        return {
          ...rate,
          perKgUSD: Number(value) || 0,
        };
      });

      return {
        ...prev,
        internationalZoneRates: nextRates,
      };
    });
  };

  const removeZoneRate = (index: number) => {
    setFormData((prev) => {
      const removedZone = normalizeZoneCode(
        prev.internationalZoneRates[index]?.zone || "",
      );
      const nextRates = prev.internationalZoneRates.filter(
        (_, idx) => idx !== index,
      );
      const nextMap = { ...prev.internationalCountryZones };

      if (removedZone) {
        Object.keys(nextMap).forEach((countryCode) => {
          if (normalizeZoneCode(nextMap[countryCode]) === removedZone) {
            delete nextMap[countryCode];
          }
        });
      }

      return {
        ...prev,
        internationalZoneRates: nextRates.length
          ? nextRates
          : [{ zone: "A", minWeight: 0, maxWeight: 0, perKgUSD: 0 }],
        internationalCountryZones: nextMap,
      };
    });
  };

  const assignCountryZone = () => {
    const countryCode = normalizeCountryCode(selectedZoneCountry);
    const zoneCode = normalizeZoneCode(selectedZoneCode);

    if (!countryCode || !zoneCode) {
      toast.error(
        tr("اختر الدولة والمنطقة أولاً", "Select country and zone first"),
      );
      return;
    }

    const availableZones = getAvailableZoneCodes();
    if (!availableZones.includes(zoneCode)) {
      toast.error(
        tr("المنطقة المختارة غير موجودة", "Selected zone does not exist"),
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      internationalCountryZones: {
        ...prev.internationalCountryZones,
        [countryCode]: zoneCode,
      },
    }));
  };

  const removeCountryZone = (countryCode: string) => {
    setFormData((prev) => {
      const nextMap = { ...prev.internationalCountryZones };
      delete nextMap[countryCode];

      return {
        ...prev,
        internationalCountryZones: nextMap,
      };
    });
  };

  const addOffer = () => {
    setFormData((prev) => ({
      ...prev,
      offers: [...(prev.offers || []), createEmptyOffer()],
    }));
  };

  const updateOfferField = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      offers: (prev.offers || []).map((offer, idx) =>
        idx === index ? { ...offer, [field]: value } : offer,
      ),
    }));
  };

  const removeOffer = (index: number) => {
    setFormData((prev) => {
      const nextOffers = (prev.offers || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        offers: nextOffers.length > 0 ? nextOffers : [createEmptyOffer()],
      };
    });
  };

  const normalizeOffersForForm = (offers: any[]) =>
    offers.map((offer: any) => ({
      title: String(offer?.title || ""),
      titleEn: String(offer?.titleEn || ""),
      subtitle: "",
      subtitleEn: "",
      description: String(offer?.description || ""),
      descriptionEn: String(offer?.descriptionEn || ""),
      imageUrl: "",
      ctaText: tr("اشحن الآن", "Ship now"),
      ctaTextEn: "Ship now",
      ctaLink: getOfferTargetCompanyId()
        ? `/create-shipment?companyId=${encodeURIComponent(getOfferTargetCompanyId())}`
        : "/create-shipment",
      background: "",
      localPriceSYP: Number(offer?.localPriceSYP ?? offer?.localPrice ?? 0),
      localPriceUSD: 0,
      internationalPriceSYP: 0,
      internationalPriceUSD: Number(
        offer?.internationalPriceUSD ?? offer?.internationalPrice ?? 0,
      ),
      codFeeSYP: Number(offer?.codFeeSYP ?? offer?.codFee ?? 0),
      codFeeUSD: Number(offer?.codFeeUSD || 0),
      expressFeeSYP: Number(offer?.expressFeeSYP || 0),
      expressFeeUSD: Number(offer?.expressFeeUSD || 0),
      durationDays: 0,
      durationHours: 0,
      packagingFeeSYP: Number(offer?.packagingFeeSYP || 0),
      packagingFeeUSD: Number(offer?.packagingFeeUSD || 0),
      isActive: true,
      startAt: offer?.startAt
        ? new Date(offer.startAt).toISOString().slice(0, 16)
        : "",
      endAt: offer?.endAt
        ? new Date(offer.endAt).toISOString().slice(0, 16)
        : "",
    }));

  const buildCleanedOffers = () => {
    const cleanedOffers = (formData.offers || [])
      .map((offer) => ({
        title: String(offer.title || "").trim(),
        titleEn: String((offer as any).titleEn || "").trim(),
        subtitle: "",
        subtitleEn: "",
        description: String(offer.description || "").trim(),
        descriptionEn: String((offer as any).descriptionEn || "").trim(),
        imageUrl: "",
        ctaText: tr("اشحن الآن", "Ship now"),
        ctaTextEn: "Ship now",
        ctaLink: getOfferTargetCompanyId()
          ? `/create-shipment?companyId=${encodeURIComponent(getOfferTargetCompanyId())}`
          : "/create-shipment",
        background: "",
        localPriceSYP: Number((offer as any).localPriceSYP || 0),
        localPriceUSD: 0,
        internationalPriceSYP: 0,
        internationalPriceUSD: Number(
          (offer as any).internationalPriceUSD || 0,
        ),
        codFeeSYP: Number((offer as any).codFeeSYP || 0),
        codFeeUSD: Number((offer as any).codFeeUSD || 0),
        expressFeeSYP: Number((offer as any).expressFeeSYP || 0),
        expressFeeUSD: Number((offer as any).expressFeeUSD || 0),
        durationDays: 0,
        durationHours: 0,
        packagingFeeSYP: Number((offer as any).packagingFeeSYP || 0),
        packagingFeeUSD: Number((offer as any).packagingFeeUSD || 0),
        isActive: true,
        startAt: offer.startAt ? new Date(offer.startAt).toISOString() : null,
        endAt: offer.endAt ? new Date(offer.endAt).toISOString() : null,
      }))
      .filter((offer) => offer.title || offer.titleEn);

    const missingRequiredDate = cleanedOffers.some(
      (offer) => !offer.startAt || !offer.endAt,
    );

    const invalidOfferDate = cleanedOffers.some(
      (offer) => offer.startAt && offer.endAt && offer.endAt < offer.startAt,
    );

    return { cleanedOffers, invalidOfferDate, missingRequiredDate };
  };

  const handleSaveOffers = async () => {
    const { cleanedOffers, invalidOfferDate, missingRequiredDate } =
      buildCleanedOffers();

    if (missingRequiredDate) {
      toast.error(
        tr(
          "يجب تحديد تاريخ ووقت بداية ونهاية العرض",
          "Offer start and end date/time are required",
        ),
      );
      return;
    }

    if (invalidOfferDate) {
      toast.error(
        tr(
          "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية",
          "Offer end date must be after start date",
        ),
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      offers:
        cleanedOffers.length > 0
          ? normalizeOffersForForm(cleanedOffers)
          : [createEmptyOffer()],
    }));

    if (!selectedCompany && !isCompanyAdmin) {
      toast.success(
        tr(
          "تم تجهيز العروض داخل النموذج. احفظ الشركة لتثبيت البيانات نهائياً.",
          "Offers were prepared in the form. Save the company to persist them.",
        ),
      );
      setIsOffersDialogOpen(false);
      return;
    }

    try {
      if (isCompanyAdmin) {
        await adminService.updateMyCompany({ offers: cleanedOffers });
      } else if (selectedCompany?._id) {
        await adminService.updateCompany(selectedCompany._id, {
          offers: cleanedOffers,
        });
      }

      toast.success(tr("تم حفظ العروض بنجاح", "Offers saved successfully"));
      setIsOffersDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message || tr("فشل حفظ العروض", "Failed to save offers"),
      );
    }
  };

  const addSupportedCountry = (country: GlobalCountry) => {
    setSelectedInternationalCountry(country.code);
    setFormData((prev) => {
      if (prev.supportedCountries.includes(country.code)) {
        return prev;
      }

      return {
        ...prev,
        supportedCountries: [...prev.supportedCountries, country.code],
      };
    });
  };

  const removeSupportedCountry = (countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedCountries: prev.supportedCountries.filter(
        (code) => code !== countryCode,
      ),
    }));
  };

  const addSupportedLocalState = (state: GlobalState) => {
    setSelectedLocalState(state.code);
    setFormData((prev) => {
      if (prev.supportedLocalStates.includes(state.code)) {
        return prev;
      }

      return {
        ...prev,
        supportedLocalStates: [...prev.supportedLocalStates, state.code],
      };
    });
  };

  const removeSupportedLocalState = (stateCode: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedLocalStates: prev.supportedLocalStates.filter(
        (code) => code !== stateCode,
      ),
    }));
  };

  useEffect(() => {
    fetchCompanies();
  }, [isCompanyAdmin]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);

      if (isCompanyAdmin) {
        const company = await adminService.getMyCompany();
        setCompanies(company ? [company] : []);
        return;
      }

      const response = await adminService.getAllCompanies({ limit: 50 });
      setCompanies(response.data);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل شركات الشحن", "Failed to load shipping companies"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedCompany(null);
    setFormData(emptyForm);
    setIsOffersDialogOpen(false);
    setSelectedInternationalCountry("SY");
    setSelectedLocalState("DAM");
    setSelectedZoneCountry("SY");
    setSelectedZoneCode("A");
    setIncludeAllCountries(true);
    setIncludeAllLocalStates(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    const normalizedSupportedCountries = (company.supportedCountries || [])
      .map((value: string) => normalizeCountryCode(value))
      .filter(Boolean);
    const normalizedSupportedLocalStates = (company.supportedLocalStates || [])
      .map((value: string) => normalizeStateCode(value))
      .filter(Boolean);
    const normalizedZoneRates = Array.isArray(company.internationalZoneRates)
      ? company.internationalZoneRates
          .map((entry: any) => ({
            zone: normalizeZoneCode(entry?.zone),
            minWeight: Math.max(0, Number(entry?.minWeight || 0)),
            maxWeight: Math.max(0, Number(entry?.maxWeight || 0)),
            perKgUSD: Number(entry?.perKgUSD || 0),
          }))
          .filter((entry: any) => entry.zone)
      : [];
    const normalizedCountryZones = Object.entries(
      company.internationalCountryZones || {},
    ).reduce((acc: Record<string, string>, [countryCode, zone]) => {
      const normalizedCountry = normalizeCountryCode(countryCode);
      const normalizedZone = normalizeZoneCode(String(zone));
      if (!normalizedCountry || !normalizedZone) return acc;
      acc[normalizedCountry] = normalizedZone;
      return acc;
    }, {});
    const normalizedOffers = Array.isArray(company.offers)
      ? normalizeOffersForForm(company.offers)
      : [];

    setSelectedCompany(company);
    setFormData({
      name: company.name || "",
      code: company.code || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      description: company.description || "",
      logoUrl: company.logoUrl || "",
      trackingUrlTemplate: company.trackingUrlTemplate || "",
      supportedCountries: normalizedSupportedCountries,
      supportedLocalStates: normalizedSupportedLocalStates,
      supportsLocal: company.supportsLocal,
      supportsInternational: company.supportsInternational,
      localPerKgSYP: company.pricing?.localPerKgSYP || 0,
      internationalPerKgUSD: company.pricing?.internationalPerKgUSD || 0,
      internationalZoneRates:
        normalizedZoneRates.length > 0
          ? normalizedZoneRates
          : [{ zone: "A", minWeight: 0, maxWeight: 0, perKgUSD: 0 }],
      internationalCountryZones: normalizedCountryZones,
      offers:
        normalizedOffers.length > 0 ? normalizedOffers : [createEmptyOffer()],
      volumetricDivisor: Number(company.volumetricDivisor) || 6000,
      codEnabled: company.codService?.enabled || false,
      codLocalFeeSYP: company.codService?.localFeeSYP || 0,
      codInternationalFeeUSD: company.codService?.internationalFeeUSD || 0,
      expressEnabled: company.expressService?.enabled || false,
      expressLocalFeeSYP: company.expressService?.localFeeSYP || 0,
      expressInternationalFeeUSD:
        company.expressService?.internationalFeeUSD || 0,
      packagingEnabled: company.packagingService?.enabled || false,
      packagingLocalFeeSYP: company.packagingService?.localFeeSYP || 0,
      packagingInternationalFeeUSD:
        company.packagingService?.internationalFeeUSD || 0,
      isActive: company.isActive,
    });
    setSelectedInternationalCountry("SY");
    setSelectedLocalState("DAM");
    setSelectedZoneCountry("SY");
    setSelectedZoneCode(
      normalizedZoneRates[0]?.zone ||
        Object.values(normalizedCountryZones)[0] ||
        "A",
    );
    setIncludeAllCountries(normalizedSupportedCountries.length === 0);
    setIncludeAllLocalStates(normalizedSupportedLocalStates.length === 0);
    setIsOffersDialogOpen(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!includeAllCountries && formData.supportedCountries.length === 0) {
      toast.error(
        language === "ar"
          ? "يرجى اختيار دولة واحدة على الأقل أو تفعيل خيار جميع الدول"
          : "Select at least one country or enable all countries",
      );
      return;
    }

    if (!includeAllLocalStates && formData.supportedLocalStates.length === 0) {
      toast.error(
        language === "ar"
          ? "يرجى اختيار محافظة واحدة على الأقل أو تفعيل خيار جميع المحافظات"
          : "Select at least one state or enable all states",
      );
      return;
    }

    const cleanedZoneRates = formData.internationalZoneRates
      .map((rate) => ({
        zone: normalizeZoneCode(rate.zone),
        minWeight: Math.max(0, Number((rate as any).minWeight || 0)),
        maxWeight: Math.max(0, Number((rate as any).maxWeight || 0)),
        perKgUSD: Number(rate.perKgUSD) || 0,
      }))
      .filter((rate) => rate.zone);

    const hasInvalidWeightRange = cleanedZoneRates.some(
      (rate) => rate.maxWeight > 0 && rate.maxWeight < rate.minWeight,
    );

    if (hasInvalidWeightRange) {
      toast.error(
        tr(
          "كل شريحة وزن يجب أن يكون فيها الحد الأعلى أكبر أو يساوي الحد الأدنى",
          "Each slab max weight must be greater than or equal to min weight",
        ),
      );
      return;
    }

    const cleanedCountryZones = Object.entries(
      formData.internationalCountryZones,
    ).reduce((acc: Record<string, string>, [countryCode, zoneCode]) => {
      const normalizedCountry = normalizeCountryCode(countryCode);
      const normalizedZone = normalizeZoneCode(zoneCode);
      if (!normalizedCountry || !normalizedZone) {
        return acc;
      }
      acc[normalizedCountry] = normalizedZone;
      return acc;
    }, {});

    const zoneCodesSet = new Set(cleanedZoneRates.map((rate) => rate.zone));
    const invalidCountryZone = Object.values(cleanedCountryZones).some(
      (zoneCode) => !zoneCodesSet.has(zoneCode),
    );

    if (invalidCountryZone) {
      toast.error(
        tr(
          "يوجد ربط دولة مع Zone غير معرّفة في قائمة الأسعار",
          "Some countries are mapped to undefined zones",
        ),
      );
      return;
    }

    const { cleanedOffers, invalidOfferDate } = buildCleanedOffers();

    if (invalidOfferDate) {
      toast.error(
        tr(
          "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية",
          "Offer end date must be after start date",
        ),
      );
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      description: formData.description,
      logoUrl: formData.logoUrl,
      trackingUrlTemplate: formData.trackingUrlTemplate,
      supportedCountries: includeAllCountries
        ? []
        : formData.supportedCountries,
      supportedLocalStates: includeAllLocalStates
        ? []
        : formData.supportedLocalStates,
      supportsLocal: formData.supportsLocal,
      supportsInternational: formData.supportsInternational,
      pricing: {
        localPerKgSYP: Number(formData.localPerKgSYP),
        internationalPerKgUSD: Number(formData.internationalPerKgUSD),
      },
      internationalZoneRates: cleanedZoneRates,
      internationalCountryZones: cleanedCountryZones,
      offers: cleanedOffers,
      volumetricDivisor: Number(formData.volumetricDivisor) || 6000,
      codService: {
        enabled: formData.codEnabled,
        localFeeSYP: Number(formData.codLocalFeeSYP),
        internationalFeeUSD: Number(formData.codInternationalFeeUSD),
      },
      expressService: {
        enabled: formData.expressEnabled,
        localFeeSYP: Number(formData.expressLocalFeeSYP),
        internationalFeeUSD: Number(formData.expressInternationalFeeUSD),
      },
      packagingService: {
        enabled: formData.packagingEnabled,
        localFeeSYP: Number(formData.packagingLocalFeeSYP),
        internationalFeeUSD: Number(formData.packagingInternationalFeeUSD),
      },
      isActive: formData.isActive,
    };

    try {
      if (isCompanyAdmin) {
        await adminService.updateMyCompany(payload);
        toast.success(
          tr(
            "تم تحديث إعدادات شركة الشحن بنجاح",
            "Shipping company settings updated successfully",
          ),
        );
      } else if (selectedCompany) {
        await adminService.updateCompany(selectedCompany._id, payload);
        toast.success(
          tr(
            "تم تحديث شركة الشحن بنجاح",
            "Shipping company updated successfully",
          ),
        );
      } else {
        await adminService.createCompany(payload);
        toast.success(
          tr(
            "تم إنشاء شركة الشحن بنجاح",
            "Shipping company created successfully",
          ),
        );
      }

      setIsDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حفظ شركة الشحن", "Failed to save shipping company"),
      );
    }
  };

  const handleToggleStatus = async (company: any) => {
    try {
      await adminService.updateCompany(company._id, {
        isActive: !company.isActive,
      });
      toast.success(
        company.isActive
          ? tr("تم إيقاف الشركة", "Company deactivated")
          : tr("تم تفعيل الشركة", "Company activated"),
      );
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحديث حالة الشركة", "Failed to update company status"),
      );
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        tr(
          "هل تريد حذف شركة الشحن نهائياً؟",
          "Do you want to permanently delete this shipping company?",
        ),
      )
    )
      return;

    try {
      await adminService.deleteCompany(companyId);
      toast.success(tr("تم حذف شركة الشحن", "Shipping company deleted"));
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حذف شركة الشحن", "Failed to delete shipping company"),
      );
    }
  };

  const openAccountDialog = (company: any) => {
    setAccountCompany(company);
    setAccountData({
      name: company.ownerUserId?.name || "",
      email: company.ownerUserId?.email || "",
      phone: company.ownerUserId?.phone || "",
      password: "",
      resetPassword: false,
    });
    setIsAccountDialogOpen(true);
  };

  const handleSaveCompanyAccount = async () => {
    if (!accountCompany) return;

    try {
      await adminService.upsertCompanyAdminAccount(accountCompany._id, {
        name: accountData.name,
        email: accountData.email,
        phone: accountData.phone,
        password: accountData.password || undefined,
        resetPassword: accountData.resetPassword,
      });

      toast.success(
        tr("تم حفظ حساب الشركة بنجاح", "Company account saved successfully"),
      );
      setIsAccountDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حفظ حساب الشركة", "Failed to save company account"),
      );
    }
  };

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const uploadedLogoUrl = await adminService.uploadCompanyLogo(file);
      setFormData((prev) => ({ ...prev, logoUrl: uploadedLogoUrl }));
      toast.success(
        tr("تم رفع شعار الشركة بنجاح", "Company logo uploaded successfully"),
      );
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل رفع شعار الشركة", "Failed to upload company logo"),
      );
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleOfferImageFileChange =
    (index: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setUploadingOfferIndex(index);

        let imageUrl = "";
        try {
          imageUrl = await adminService.uploadCompanyLogo(file);
        } catch {
          // Fallback to data URL if upload endpoint is unavailable.
          imageUrl = await readFileAsDataUrl(file);
        }

        updateOfferField(index, "imageUrl", imageUrl);
        toast.success(
          tr("تم تحديد صورة العرض بنجاح", "Offer image selected successfully"),
        );
      } catch (error: any) {
        toast.error(
          error.message ||
            tr("فشل تحميل صورة العرض", "Failed to load offer image"),
        );
      } finally {
        setUploadingOfferIndex(null);
        event.target.value = "";
      }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">شركات الشحن</h1>
          <p className="mt-1 text-sm text-slate-500">
            إضافة وتعديل وتفعيل شركات الشحن وربطها بالنظام.
          </p>
        </div>
        {!isCompanyAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            إضافة شركة
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              جاري تحميل الشركات...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>الأسعار</TableHead>
                  <TableHead>المستخدمون</TableHead>
                  <TableHead>الشحنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-9 w-9 rounded-xl object-cover border"
                          />
                        ) : (
                          <div className="rounded-xl bg-slate-100 p-2">
                            <Building2 className="h-4 w-4 text-slate-700" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {company.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {company.email || company.phone || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {company.pricing?.localPerKgSYP || 0} ل.س / كغ
                        </div>
                        <div>
                          {company.pricing?.internationalPerKgUSD || 0} $ / كغ
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Zones دولية:{" "}
                          {company.internationalZoneRates?.length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {company.codService?.enabled
                            ? `الدفع عند الاستلام: ${company.codService?.localFeeSYP || 0} ل.س | ${company.codService?.internationalFeeUSD || 0} $`
                            : "الدفع عند الاستلام غير مفعّل"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {company.expressService?.enabled
                            ? `الشحن السريع: ${company.expressService?.localFeeSYP || 0} ل.س | ${company.expressService?.internationalFeeUSD || 0} $`
                            : "الشحن السريع غير مفعّل"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.usersCount || 0}</TableCell>
                    <TableCell>{company.shipmentsCount || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={company.isActive ? "default" : "secondary"}
                      >
                        {company.isActive ? "مفعلة" : "موقفة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!isCompanyAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAccountDialog(company)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isCompanyAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(company)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCompany(company._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "تعديل شركة الشحن" : "إضافة شركة شحن"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>اسم الشركة</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>الكود</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>العنوان</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>شعار الشركة (من الكمبيوتر)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                disabled={isUploadingLogo}
              />
              {isUploadingLogo && (
                <p className="mt-2 text-xs text-slate-500">
                  جاري رفع الشعار...
                </p>
              )}
              {formData.logoUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                  <div className="relative h-12 w-12">
                    <img
                      src={formData.logoUrl}
                      alt="Company logo"
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-red-600 shadow border border-slate-200 hover:bg-red-50"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, logoUrl: "" }))
                      }
                      aria-label="Delete selected logo"
                      title={tr("حذف الصورة", "Delete image")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    تم اختيار شعار للشركة
                  </p>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>وصف الشركة</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="نبذة قصيرة عن الشركة والخدمات"
              />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">عروض الشركة</Label>
                  <p className="mt-1 text-xs text-slate-500">
                    أضف العروض من نافذة مستقلة بدل خلطها مع بقية معلومات الشركة.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    كل عرض يدعم الصورة، عنوان ووصف واضحين، مدة بالأيام والساعات،
                    وتسعير الشحن وCOD والشحن السريع بالليرة السورية والدولار.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOffersDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  إدارة العروض
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(formData.offers || []).filter(
                  (offer) => offer.title || (offer as any).titleEn,
                ).length > 0 ? (
                  (formData.offers || [])
                    .filter((offer) => offer.title || (offer as any).titleEn)
                    .map((offer, idx) => (
                      <div
                        key={`offer-summary-${idx}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {offer.title || (offer as any).titleEn}
                            </p>
                            {offer.subtitle ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {offer.subtitle}
                              </p>
                            ) : (offer as any).subtitleEn ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {(offer as any).subtitleEn}
                              </p>
                            ) : null}
                          </div>
                          <Badge variant="default">مجدول</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            المحلي:{" "}
                            {Number(
                              (offer as any).localPriceSYP || 0,
                            ).toLocaleString()}{" "}
                            ل.س
                          </div>
                          <div>
                            الدولي: $
                            {Number(
                              (offer as any).internationalPriceUSD || 0,
                            ).toLocaleString()}
                          </div>
                          <div>
                            COD:{" "}
                            {Number(
                              (offer as any).codFeeSYP || 0,
                            ).toLocaleString()}{" "}
                            ل.س | $
                            {Number(
                              (offer as any).codFeeUSD || 0,
                            ).toLocaleString()}
                          </div>
                          <div>
                            السريع:{" "}
                            {Number(
                              (offer as any).expressFeeSYP || 0,
                            ).toLocaleString()}{" "}
                            ل.س | $
                            {Number(
                              (offer as any).expressFeeUSD || 0,
                            ).toLocaleString()}
                          </div>
                          <div className="col-span-2">
                            المدة: {formatOfferDurationLabel(offer as any)}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500">
                    لا توجد عروض مضافة بعد.
                  </p>
                )}
              </div>
            </div>

            <Dialog
              open={isOffersDialogOpen}
              onOpenChange={setIsOffersDialogOpen}
            >
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إدارة عروض الشركة</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      هذه العروض تظهر بشكل مستقل عن معلومات الشركة، مع تفاصيل
                      التسعير فقط.
                    </p>
                    <Button type="button" variant="outline" onClick={addOffer}>
                      <Plus className="mr-2 h-4 w-4" />
                      إضافة عرض
                    </Button>
                  </div>

                  {(formData.offers || []).map((offer, idx) => (
                    <div
                      key={`offer-${idx}`}
                      className="rounded-lg border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          العرض #{idx + 1}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOffer(idx)}
                        >
                          حذف
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <Label>عنوان العرض (عربي)</Label>
                          <Input
                            value={offer.title}
                            onChange={(e) =>
                              updateOfferField(idx, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Offer title (English)</Label>
                          <Input
                            value={(offer as any).titleEn || ""}
                            onChange={(e) =>
                              updateOfferField(idx, "titleEn", e.target.value)
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>وصف العرض (عربي)</Label>
                          <Textarea
                            value={offer.description}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={2}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description (English)</Label>
                          <Textarea
                            value={(offer as any).descriptionEn || ""}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "descriptionEn",
                                e.target.value,
                              )
                            }
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>الشحن المحلي (ل.س)</Label>
                          <Input
                            type="number"
                            value={(offer as any).localPriceSYP}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "localPriceSYP",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <p className="pt-8 text-xs text-slate-500">
                            المحلي في العروض يُسعر بالليرة السورية فقط.
                          </p>
                        </div>
                        <div>
                          <Label>الشحن الدولي ($)</Label>
                          <Input
                            type="number"
                            value={(offer as any).internationalPriceUSD}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "internationalPriceUSD",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>رسوم COD (ل.س)</Label>
                          <Input
                            type="number"
                            value={(offer as any).codFeeSYP}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "codFeeSYP",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>رسوم COD ($)</Label>
                          <Input
                            type="number"
                            value={(offer as any).codFeeUSD}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "codFeeUSD",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>الشحن السريع (ل.س)</Label>
                          <Input
                            type="number"
                            value={(offer as any).expressFeeSYP}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "expressFeeSYP",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>الشحن السريع ($)</Label>
                          <Input
                            type="number"
                            value={(offer as any).expressFeeUSD}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "expressFeeUSD",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>التغليف (ل.س)</Label>
                          <Input
                            type="number"
                            value={(offer as any).packagingFeeSYP}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "packagingFeeSYP",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>التغليف ($)</Label>
                          <Input
                            type="number"
                            value={(offer as any).packagingFeeUSD}
                            onChange={(e) =>
                              updateOfferField(
                                idx,
                                "packagingFeeUSD",
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-medium text-slate-800">
                            الزر ثابت: اشحن الآن
                          </p>
                          <p className="mt-1">
                            الرابط يُنشأ تلقائياً إلى صفحة إنشاء الشحنة مع
                            الشركة المرتبطة فقط، لذلك لا يمكن تعديله هنا.
                          </p>
                        </div>
                        <div>
                          <Label>يبدأ من</Label>
                          <Input
                            type="datetime-local"
                            value={offer.startAt || ""}
                            onChange={(e) =>
                              updateOfferField(idx, "startAt", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>ينتهي في</Label>
                          <Input
                            type="datetime-local"
                            value={offer.endAt || ""}
                            onChange={(e) =>
                              updateOfferField(idx, "endAt", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="button" onClick={handleSaveOffers}>
                    حفظ العرض
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOffersDialogOpen(false)}
                  >
                    إغلاق
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="md:col-span-2">
              <Label>رابط تتبع الشحنة</Label>
              <Input
                value={formData.trackingUrlTemplate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trackingUrlTemplate: e.target.value,
                  }))
                }
                placeholder="مثال: https://company.com/track/{trackingNumber}"
              />
              <p className="mt-1 text-xs text-slate-500">
                استخدم المتغير {`{trackingNumber}`} داخل الرابط ليتم استبداله
                برقم التتبع تلقائيًا.
              </p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <Label>الدول المدعومة دولياً (نفس اختيار إنشاء الشحنة)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAllCountries}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIncludeAllCountries(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        supportedCountries: [],
                      }));
                    }
                  }}
                />
                <Label>اختيار جميع الدول</Label>
              </div>
              <GlobalCountrySelector
                value={selectedInternationalCountry}
                onChange={addSupportedCountry}
                className="h-11"
                disabled={includeAllCountries}
              />
              <div className="flex flex-wrap gap-2">
                {includeAllCountries ? (
                  <span className="text-xs text-slate-500">
                    الشركة تدعم جميع الدول الدولية.
                  </span>
                ) : formData.supportedCountries.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    لم يتم اختيار أي دولة بعد.
                  </span>
                ) : (
                  formData.supportedCountries.map((countryCode) => {
                    const country = getCountryByCode(countryCode);
                    return (
                      <span
                        key={countryCode}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                      >
                        {country?.name.ar || countryCode}
                        <button
                          type="button"
                          onClick={() => removeSupportedCountry(countryCode)}
                          className="rounded-full p-0.5 hover:bg-blue-100"
                          aria-label="remove-country"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <Label>المحافظات السورية المدعومة للشحن المحلي</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAllLocalStates}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIncludeAllLocalStates(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        supportedLocalStates: [],
                      }));
                    }
                  }}
                />
                <Label>اختيار جميع المحافظات</Label>
              </div>
              <SearchableStateSelector
                countryCode="SY"
                value={selectedLocalState}
                onChange={addSupportedLocalState}
                className="h-11"
                disabled={includeAllLocalStates}
              />
              <div className="flex flex-wrap gap-2">
                {includeAllLocalStates ? (
                  <span className="text-xs text-slate-500">
                    الشركة تدعم جميع المحافظات السورية.
                  </span>
                ) : formData.supportedLocalStates.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    لم يتم اختيار أي محافظة بعد.
                  </span>
                ) : (
                  formData.supportedLocalStates.map((stateCode) => {
                    const state = getStateByCode("SY", stateCode);
                    return (
                      <span
                        key={stateCode}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                      >
                        {state?.name.ar || stateCode}
                        <button
                          type="button"
                          onClick={() => removeSupportedLocalState(stateCode)}
                          className="rounded-full p-0.5 hover:bg-emerald-100"
                          aria-label="remove-state"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <Label>سعر المحلي لكل كغ (ل.س)</Label>
              <Input
                type="number"
                value={formData.localPerKgSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    localPerKgSYP: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>سعر الدولي لكل كغ ($)</Label>
              <Input
                type="number"
                value={formData.internationalPerKgUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    internationalPerKgUSD: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 p-4">
              <div>
                <Label className="text-sm font-semibold">
                  تسعير Zones للشحن الدولي
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  لكل Zone يمكنك إضافة شرائح وزن متعددة (من/إلى) ولكل شريحة سعر
                  مختلف بالدولار لكل كغ.
                </p>
              </div>

              <div className="space-y-2">
                {formData.internationalZoneRates.map((zoneRate, idx) => (
                  <div
                    key={`${zoneRate.zone}-${idx}`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[100px_120px_120px_1fr_auto]"
                  >
                    <Input
                      value={zoneRate.zone}
                      onChange={(e) =>
                        updateZoneRate(idx, "zone", e.target.value)
                      }
                      placeholder="Zone"
                      maxLength={8}
                    />
                    <Input
                      type="number"
                      value={(zoneRate as any).minWeight || 0}
                      onChange={(e) =>
                        updateZoneRate(idx, "minWeight", e.target.value)
                      }
                      placeholder="Min Kg"
                    />
                    <Input
                      type="number"
                      value={(zoneRate as any).maxWeight || 0}
                      onChange={(e) =>
                        updateZoneRate(idx, "maxWeight", e.target.value)
                      }
                      placeholder="Max Kg (0=∞)"
                    />
                    <Input
                      type="number"
                      value={zoneRate.perKgUSD}
                      onChange={(e) =>
                        updateZoneRate(idx, "perKgUSD", e.target.value)
                      }
                      placeholder="USD/Kg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeZoneRate(idx)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <Button type="button" variant="outline" onClick={addZoneRate}>
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة Zone
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <Label>الدولة</Label>
                  <GlobalCountrySelector
                    value={selectedZoneCountry}
                    onChange={(country) => setSelectedZoneCountry(country.code)}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label>الـ Zone</Label>
                  <select
                    value={selectedZoneCode}
                    onChange={(e) => setSelectedZoneCode(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {getAvailableZoneCodes().map((zoneCode) => (
                      <option key={zoneCode} value={zoneCode}>
                        {zoneCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={assignCountryZone}
                    className="w-full"
                  >
                    ربط الدولة بالـ Zone
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(formData.internationalCountryZones).length ===
                0 ? (
                  <span className="text-xs text-slate-500">
                    لا يوجد ربط دول بالـ Zones بعد.
                  </span>
                ) : (
                  Object.entries(formData.internationalCountryZones).map(
                    ([countryCode, zoneCode]) => {
                      const country = getCountryByCode(countryCode);
                      return (
                        <span
                          key={`${countryCode}-${zoneCode}`}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
                        >
                          {(country?.name.ar || countryCode) +
                            " -> " +
                            zoneCode}
                          <button
                            type="button"
                            onClick={() => removeCountryZone(countryCode)}
                            className="rounded-full p-0.5 hover:bg-amber-100"
                            aria-label="remove-country-zone"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    },
                  )
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>
                معامل القسمة للحجم (الطول × العرض × الارتفاع ÷ المعامل)
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.volumetricDivisor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    volumetricDivisor: Number(e.target.value) || 6000,
                  }))
                }
                placeholder="6000"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.codEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codEnabled: e.target.checked,
                  }))
                }
              />
              <Label>تفعيل خدمة الدفع عند الاستلام</Label>
            </div>
            <div>
              <Label>رسوم الدفع عند الاستلام المحلية (ل.س)</Label>
              <Input
                type="number"
                value={formData.codLocalFeeSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codLocalFeeSYP: Number(e.target.value),
                  }))
                }
                disabled={!formData.codEnabled}
              />
            </div>
            <div>
              <Label>رسوم الدفع عند الاستلام الدولية ($)</Label>
              <Input
                type="number"
                value={formData.codInternationalFeeUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codInternationalFeeUSD: Number(e.target.value),
                  }))
                }
                disabled={!formData.codEnabled}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.expressEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expressEnabled: e.target.checked,
                  }))
                }
              />
              <Label>تفعيل خدمة الشحن السريع</Label>
            </div>
            <div>
              <Label>رسوم الشحن السريع المحلية (ل.س)</Label>
              <Input
                type="number"
                value={formData.expressLocalFeeSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expressLocalFeeSYP: Number(e.target.value),
                  }))
                }
                disabled={!formData.expressEnabled}
              />
            </div>
            <div>
              <Label>رسوم الشحن السريع الدولية ($)</Label>
              <Input
                type="number"
                value={formData.expressInternationalFeeUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expressInternationalFeeUSD: Number(e.target.value),
                  }))
                }
                disabled={!formData.expressEnabled}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.packagingEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packagingEnabled: e.target.checked,
                  }))
                }
              />
              <Label>تفعيل خدمة التغليف</Label>
            </div>
            <div>
              <Label>رسوم التغليف المحلية (ل.س)</Label>
              <Input
                type="number"
                value={formData.packagingLocalFeeSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packagingLocalFeeSYP: Number(e.target.value),
                  }))
                }
                disabled={!formData.packagingEnabled}
              />
            </div>
            <div>
              <Label>رسوم التغليف الدولية ($)</Label>
              <Input
                type="number"
                value={formData.packagingInternationalFeeUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packagingInternationalFeeUSD: Number(e.target.value),
                  }))
                }
                disabled={!formData.packagingEnabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.supportsLocal}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    supportsLocal: e.target.checked,
                  }))
                }
              />
              <Label>يدعم الشحن المحلي</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.supportsInternational}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    supportsInternational: e.target.checked,
                  }))
                }
              />
              <Label>يدعم الشحن الدولي</Label>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              <Label>الشركة مفعلة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حساب شركة الشحن</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              الشركة:{" "}
              <span className="font-semibold text-slate-900">
                {accountCompany?.name}
              </span>
            </div>
            <div>
              <Label>اسم صاحب الحساب</Label>
              <Input
                value={accountData.name}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={accountData.email}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={accountData.phone}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>كلمة مرور مؤقتة (اختياري عند التعديل)</Label>
              <Input
                type="password"
                value={accountData.password}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="اتركها فارغة إذا لا تريد تغيير كلمة المرور"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountData.resetPassword}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    resetPassword: e.target.checked,
                  }))
                }
              />
              <Label>إجبار تحديث كلمة المرور بهذه القيمة</Label>
            </div>
            <p className="text-xs text-slate-500">
              بعد تسليم الحساب، يمكن لمدير شركة الشحن تغيير كلمة المرور من صفحة
              تغيير كلمة المرور داخل لوحة التحكم.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccountDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveCompanyAccount}>حفظ الحساب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
