import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  countriesWithProvinces,
  getProvincesByCountry,
  getCitiesByProvince,
  CountryWithProvinces,
  Province,
  City,
} from "@/data/locations";

interface LocationSelectorProps {
  selectedCountry: string;
  selectedProvince: string;
  selectedCity: string;
  onCountryChange: (country: CountryWithProvinces) => void;
  onProvinceChange: (province: Province) => void;
  onCityChange: (city: City) => void;
  countryError?: string;
  provinceError?: string;
  cityError?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCountry,
  selectedProvince,
  selectedCity,
  onCountryChange,
  onProvinceChange,
  onCityChange,
  countryError,
  provinceError,
  cityError,
}) => {
  const { t, language } = useLanguage();

  const provinces = selectedCountry
    ? getProvincesByCountry(selectedCountry)
    : [];
  const cities =
    selectedCountry && selectedProvince
      ? getCitiesByProvince(selectedCountry, selectedProvince)
      : [];

  const handleCountrySelect = (countryCode: string) => {
    const country = countriesWithProvinces.find((c) => c.code === countryCode);
    if (country) {
      onCountryChange(country);
    }
  };

  const handleProvinceSelect = (provinceCode: string) => {
    const province = provinces.find((p) => p.code === provinceCode);
    if (province) {
      onProvinceChange(province);
    }
  };

  const handleCitySelect = (cityCode: string) => {
    const city = cities.find((c) => c.code === cityCode);
    if (city) {
      onCityChange(city);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Country Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("auth.country")} <span className="text-red-500">*</span>
        </label>
        <Select value={selectedCountry} onValueChange={handleCountrySelect}>
          <SelectTrigger
            className={`w-full ${countryError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={t("form.selectCountry")} />
          </SelectTrigger>
          <SelectContent>
            {countriesWithProvinces.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name[language]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryError && (
          <p className="mt-1 text-sm text-red-600">{countryError}</p>
        )}
      </div>

      {/* Province Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("auth.province")} <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedProvince}
          onValueChange={handleProvinceSelect}
          disabled={!selectedCountry}
        >
          <SelectTrigger
            className={`w-full ${provinceError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={t("common.selectState")} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.code} value={province.code}>
                {province.name[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {provinceError && (
          <p className="mt-1 text-sm text-red-600">{provinceError}</p>
        )}
      </div>

      {/* City Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("auth.city")} <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedCity}
          onValueChange={handleCitySelect}
          disabled={!selectedProvince}
        >
          <SelectTrigger
            className={`w-full ${cityError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={t("common.selectCity")} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.code} value={city.code}>
                {city.name[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cityError && <p className="mt-1 text-sm text-red-600">{cityError}</p>}
      </div>
    </div>
  );
};
