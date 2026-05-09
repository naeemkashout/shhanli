import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import shippingCompanyService from "@/services/shippingCompanyService";
import {
  getAllCountries,
  getCountryByCode,
  getCitiesByState,
  getStateByCode,
  getStatesByCountry,
} from "@/data/globalLocations";

type CalculatorOffer = {
  _id?: string;
  title?: string;
  localPrice?: number;
  localPriceSYP?: number;
  internationalPrice?: number;
  internationalPriceUSD?: number;
  priority?: number;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
};

type CalculatorShippingCompany = {
  _id: string;
  name: string;
  supportedCountries?: string[];
  supportedLocalStates?: string[];
  supportsLocal?: boolean;
  supportsInternational?: boolean;
  volumetricDivisor?: number;
  pricing?: {
    localPerKgSYP?: number;
    internationalPerKgUSD?: number;
  };
  offers?: CalculatorOffer[];
};

const isOfferActive = (offer?: CalculatorOffer) => {
  if (!offer?.title || !offer.isActive) return false;

  const now = Date.now();
  const startAt = offer.startAt ? new Date(offer.startAt).getTime() : null;
  const endAt = offer.endAt ? new Date(offer.endAt).getTime() : null;

  if (startAt && !Number.isNaN(startAt) && startAt > now) return false;
  if (endAt && !Number.isNaN(endAt) && endAt < now) return false;

  return true;
};

const getBestActiveOffer = (company?: CalculatorShippingCompany | null) => {
  if (!company?.offers?.length) return null;

  return (
    company.offers
      .filter((offer) => isOfferActive(offer))
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))[0] ||
    null
  );
};

const normalizeCountryValue = (value: string) => value.trim().toLowerCase();

const companySupportsCountry = (
  company: CalculatorShippingCompany,
  countryCode: string,
) => {
  if (!company.supportedCountries?.length) {
    return true;
  }

  const country = getCountryByCode(countryCode);
  const acceptedValues = new Set(
    [countryCode, country?.name.ar, country?.name.en]
      .filter(Boolean)
      .map((value) => normalizeCountryValue(String(value))),
  );

  return company.supportedCountries.some((supportedCountry) =>
    acceptedValues.has(normalizeCountryValue(String(supportedCountry))),
  );
};

const companySupportsLocalState = (
  company: CalculatorShippingCompany,
  stateCode: string,
) => {
  if (!company.supportedLocalStates?.length) {
    return true;
  }

  const state = getStateByCode("SY", stateCode);
  const acceptedValues = new Set(
    [stateCode, state?.name.ar, state?.name.en]
      .filter(Boolean)
      .map((value) => normalizeCountryValue(String(value))),
  );

  return company.supportedLocalStates.some((supportedState) =>
    acceptedValues.has(normalizeCountryValue(String(supportedState))),
  );
};

export default function ShippingCalculator() {
  const { language, isRTL } = useLanguage();

  const [shippingType, setShippingType] = React.useState<
    "local" | "international"
  >("local");
  const [shippingCompanies, setShippingCompanies] = React.useState<
    CalculatorShippingCompany[]
  >([]);
  const [calculatorForm, setCalculatorForm] = React.useState({
    fromCountry: "SY",
    fromState: "",
    fromCity: "",
    toCountry: "SY",
    toState: "",
    toCity: "",
    companyId: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });
  const [calculatorResult, setCalculatorResult] = React.useState<{
    amount: number;
    currency: "SYP" | "USD";
    shippingType: "local" | "international";
    usingOffer: boolean;
    billingWeight: number;
  } | null>(null);

  React.useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companies =
          (await shippingCompanyService.getShippingCompanies()) as CalculatorShippingCompany[];
        setShippingCompanies(Array.isArray(companies) ? companies : []);
      } catch {
        setShippingCompanies([]);
      }
    };

    loadCompanies();
  }, []);

  React.useEffect(() => {
    if (shippingType === "local") {
      setCalculatorForm((prev) => ({
        ...prev,
        fromCountry: "SY",
        fromState: "",
        fromCity: "",
        toCountry: "SY",
        toState: "",
        toCity: "",
      }));
    }
    setCalculatorResult(null);
  }, [shippingType]);

  const localStates = React.useMemo(() => getStatesByCountry("SY"), []);

  const fromCities = React.useMemo(
    () =>
      calculatorForm.fromState
        ? getCitiesByState("SY", calculatorForm.fromState)
        : [],
    [calculatorForm.fromState],
  );

  const toCities = React.useMemo(
    () =>
      calculatorForm.toState
        ? getCitiesByState("SY", calculatorForm.toState)
        : [],
    [calculatorForm.toState],
  );

  const availableCountryCodes = React.useMemo(() => {
    const all = getAllCountries().map((country) => country.code);
    if (!all.includes("SY")) {
      all.unshift("SY");
    }
    return all;
  }, []);

  const availableCompaniesForCalculator = React.useMemo(() => {
    return shippingCompanies.filter((company) => {
      const supportsType =
        shippingType === "local"
          ? company.supportsLocal
          : company.supportsInternational;

      if (!supportsType) return false;

      if (shippingType === "local") {
        if (!calculatorForm.toState) return true;
        return companySupportsLocalState(company, calculatorForm.toState);
      }

      return companySupportsCountry(company, calculatorForm.toCountry);
    });
  }, [
    shippingCompanies,
    shippingType,
    calculatorForm.toCountry,
    calculatorForm.toState,
  ]);

  React.useEffect(() => {
    const selectedStillValid = availableCompaniesForCalculator.some(
      (company) => company._id === calculatorForm.companyId,
    );

    if (!selectedStillValid) {
      setCalculatorForm((prev) => ({ ...prev, companyId: "" }));
      setCalculatorResult(null);
    }
  }, [availableCompaniesForCalculator, calculatorForm.companyId]);

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

  const getCountryLabel = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    const countryName = country?.name;

    if (!countryName) return countryCode;
    if (typeof countryName === "string") return countryName;

    return language === "ar" ? countryName.ar : countryName.en;
  };

  const getStateLabel = (stateCode: string) => {
    const state = getStateByCode("SY", stateCode);
    if (!state) return stateCode;
    return language === "ar" ? state.name.ar : state.name.en;
  };

  const getCityLabel = (cityName: { ar: string; en: string }) => {
    return language === "ar" ? cityName.ar : cityName.en;
  };

  const handleCalculatePrice = () => {
    const selectedCompany = shippingCompanies.find(
      (company) => company._id === calculatorForm.companyId,
    );

    if (!selectedCompany) {
      toast.error(
        language === "ar"
          ? "يرجى اختيار شركة الشحن"
          : "Please select a shipping company",
      );
      return;
    }

    const weight = Number(calculatorForm.weight);
    const length = Number(calculatorForm.length);
    const width = Number(calculatorForm.width);
    const height = Number(calculatorForm.height);

    if (!(weight > 0)) {
      toast.error(
        language === "ar"
          ? "يرجى إدخال وزن صحيح"
          : "Please enter a valid weight",
      );
      return;
    }

    if (shippingType === "local") {
      if (!calculatorForm.fromState || !calculatorForm.fromCity) {
        toast.error(
          language === "ar"
            ? "يرجى تحديد المحافظة والمدينة لنقطة الإرسال"
            : "Please select sender governorate and city",
        );
        return;
      }

      if (!calculatorForm.toState || !calculatorForm.toCity) {
        toast.error(
          language === "ar"
            ? "يرجى تحديد المحافظة والمدينة لنقطة الاستلام"
            : "Please select receiver governorate and city",
        );
        return;
      }
    }

    const volumetricDivisor =
      Number(selectedCompany.volumetricDivisor) > 0
        ? Number(selectedCompany.volumetricDivisor)
        : 6000;

    const volumetricWeight =
      length > 0 && width > 0 && height > 0
        ? (length * width * height) / volumetricDivisor
        : 0;

    const billingWeight = Math.max(weight, volumetricWeight);
    const selectedOffer = getBestActiveOffer(selectedCompany);
    const isLocal = shippingType === "local";

    const offerAmount = selectedOffer
      ? Number(
          isLocal
            ? (selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0)
            : (selectedOffer.internationalPriceUSD ??
                selectedOffer.internationalPrice ??
                0),
        )
      : 0;

    const baseRate = Number(
      isLocal
        ? selectedCompany.pricing?.localPerKgSYP || 0
        : selectedCompany.pricing?.internationalPerKgUSD || 0,
    );

    const amount = selectedOffer ? offerAmount : billingWeight * baseRate;

    setCalculatorResult({
      amount,
      currency: isLocal ? "SYP" : "USD",
      shippingType,
      usingOffer: Boolean(selectedOffer),
      billingWeight,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div
          className={`flex items-center gap-3 ${
            language === "ar" ? "sm:flex-row-reverse" : ""
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {language === "ar"
                ? "حاسبة أسعار الشحن"
                : "Shipping Price Calculator"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === "ar"
                ? "أدخل بيانات الطرد والمسار والشركة للحصول على سعر تقريبي مطابق لمنطق إنشاء الشحنة."
                : "Enter package, route, and company details to get a shipment estimate using the same pricing logic."}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold">
              {language === "ar" ? "بيانات الحاسبة" : "Calculator Inputs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                <Label>
                  {language === "ar" ? "نوع الشحن" : "Shipping Type"}
                </Label>
                <Select
                  value={shippingType}
                  onValueChange={(value: "local" | "international") => {
                    setShippingType(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">
                      {language === "ar" ? "محلي" : "Local"}
                    </SelectItem>
                    <SelectItem value="international">
                      {language === "ar" ? "دولي" : "International"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {language === "ar" ? "من (الدولة)" : "From Country"}
                </Label>
                <Select
                  value={calculatorForm.fromCountry}
                  onValueChange={(value) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      fromCountry: value,
                    }));
                    setCalculatorResult(null);
                  }}
                  disabled={shippingType === "local"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountryCodes.map((countryCode) => (
                      <SelectItem
                        key={`from-${countryCode}`}
                        value={countryCode}
                      >
                        {getCountryLabel(countryCode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {language === "ar" ? "إلى (الدولة)" : "To Country"}
                </Label>
                <Select
                  value={calculatorForm.toCountry}
                  onValueChange={(value) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      toCountry: value,
                    }));
                    setCalculatorResult(null);
                  }}
                  disabled={shippingType === "local"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountryCodes.map((countryCode) => (
                      <SelectItem key={`to-${countryCode}`} value={countryCode}>
                        {getCountryLabel(countryCode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {shippingType === "local" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>
                      {language === "ar" ? "من (المحافظة)" : "From Governorate"}
                    </Label>
                    <Select
                      value={calculatorForm.fromState}
                      onValueChange={(value) => {
                        setCalculatorForm((prev) => ({
                          ...prev,
                          fromState: value,
                          fromCity: "",
                        }));
                        setCalculatorResult(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            language === "ar"
                              ? "اختر المحافظة"
                              : "Select governorate"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {localStates.map((state) => (
                          <SelectItem
                            key={`from-state-${state.code}`}
                            value={state.code}
                          >
                            {getStateLabel(state.code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {language === "ar" ? "من (المدينة)" : "From City"}
                    </Label>
                    <Select
                      value={calculatorForm.fromCity}
                      onValueChange={(value) => {
                        setCalculatorForm((prev) => ({
                          ...prev,
                          fromCity: value,
                        }));
                        setCalculatorResult(null);
                      }}
                      disabled={!calculatorForm.fromState}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            language === "ar" ? "اختر المدينة" : "Select city"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {fromCities.map((city) => (
                          <SelectItem
                            key={`from-city-${city.name.en}`}
                            value={city.name.en}
                          >
                            {getCityLabel(city.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {language === "ar" ? "إلى (المحافظة)" : "To Governorate"}
                    </Label>
                    <Select
                      value={calculatorForm.toState}
                      onValueChange={(value) => {
                        setCalculatorForm((prev) => ({
                          ...prev,
                          toState: value,
                          toCity: "",
                        }));
                        setCalculatorResult(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            language === "ar"
                              ? "اختر المحافظة"
                              : "Select governorate"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {localStates.map((state) => (
                          <SelectItem
                            key={`to-state-${state.code}`}
                            value={state.code}
                          >
                            {getStateLabel(state.code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {language === "ar" ? "إلى (المدينة)" : "To City"}
                    </Label>
                    <Select
                      value={calculatorForm.toCity}
                      onValueChange={(value) => {
                        setCalculatorForm((prev) => ({
                          ...prev,
                          toCity: value,
                        }));
                        setCalculatorResult(null);
                      }}
                      disabled={!calculatorForm.toState}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            language === "ar" ? "اختر المدينة" : "Select city"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {toCities.map((city) => (
                          <SelectItem
                            key={`to-city-${city.name.en}`}
                            value={city.name.en}
                          >
                            {getCityLabel(city.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5 md:col-span-2">
                <Label>
                  {language === "ar" ? "شركة الشحن" : "Shipping Company"}
                </Label>
                <Select
                  value={calculatorForm.companyId}
                  onValueChange={(value) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      companyId: value,
                    }));
                    setCalculatorResult(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        language === "ar"
                          ? "اختر شركة الشحن"
                          : "Select shipping company"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompaniesForCalculator.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {language === "ar" ? "الوزن (كغ)" : "Weight (kg)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={calculatorForm.weight}
                  onChange={(e) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }));
                    setCalculatorResult(null);
                  }}
                  placeholder={language === "ar" ? "مثال: 2.5" : "e.g. 2.5"}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  {language === "ar" ? "الطول (سم)" : "Length (cm)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorForm.length}
                  onChange={(e) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      length: e.target.value,
                    }));
                    setCalculatorResult(null);
                  }}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{language === "ar" ? "العرض (سم)" : "Width (cm)"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorForm.width}
                  onChange={(e) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      width: e.target.value,
                    }));
                    setCalculatorResult(null);
                  }}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  {language === "ar" ? "الارتفاع (سم)" : "Height (cm)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorForm.height}
                  onChange={(e) => {
                    setCalculatorForm((prev) => ({
                      ...prev,
                      height: e.target.value,
                    }));
                    setCalculatorResult(null);
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button onClick={handleCalculatePrice} className="min-h-[44px]">
                {language === "ar" ? "احسب السعر" : "Calculate Price"}
              </Button>
              <span className="text-xs text-gray-500">
                {language === "ar"
                  ? shippingType === "local"
                    ? "نوع الشحن: محلي"
                    : "نوع الشحن: دولي"
                  : shippingType === "local"
                    ? "Shipping type: Local"
                    : "Shipping type: International"}
              </span>
            </div>

            {calculatorResult ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-900 font-medium">
                  {language === "ar" ? "السعر التقديري" : "Estimated Price"}
                </p>
                <p className="mt-1 text-xl font-bold text-blue-950">
                  {calculatorResult.currency === "USD"
                    ? formatAmountUSD(calculatorResult.amount)
                    : formatAmountSYP(calculatorResult.amount)}
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  {language === "ar"
                    ? `الوزن المحاسبي: ${calculatorResult.billingWeight.toFixed(2)} كغ`
                    : `Billing weight: ${calculatorResult.billingWeight.toFixed(2)} kg`}
                  {calculatorResult.usingOffer
                    ? language === "ar"
                      ? " • تم تطبيق عرض فعال"
                      : " • Active offer applied"
                    : ""}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
