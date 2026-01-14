import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
  GlobalCountry,
  GlobalState,
  GlobalCity,
} from "@/data/globalLocations";

interface GlobalLocationSelectorProps {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onCountryChange: (country: GlobalCountry) => void;
  onStateChange: (state: GlobalState) => void;
  onCityChange: (city: GlobalCity) => void;
  countryError?: string;
  stateError?: string;
  cityError?: string;
}

export const GlobalLocationSelector: React.FC<GlobalLocationSelectorProps> = ({
  selectedCountry,
  selectedState,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange,
  countryError,
  stateError,
  cityError,
}) => {
  const { t, language } = useLanguage();
  const [countries, setCountries] = useState<GlobalCountry[]>([]);
  const [states, setStates] = useState<GlobalState[]>([]);
  const [cities, setCities] = useState<GlobalCity[]>([]);

  // Load all countries on mount
  useEffect(() => {
    const allCountries = getAllCountries();
    setCountries(allCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = getStatesByCountry(selectedCountry);
      setStates(countryStates);
      setCities([]); // Reset cities when country changes
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = getCitiesByState(selectedCountry, selectedState);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    if (country) {
      onCountryChange(country);
    }
  };

  const handleStateSelect = (stateCode: string) => {
    const state = states.find((s) => s.code === stateCode);
    if (state) {
      onStateChange(state);
    }
  };

  const handleCitySelect = (cityName: string) => {
    const city = cities.find((c) => c.name.en === cityName);
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
          <SelectContent className="max-h-[300px]">
            {countries.map((country) => (
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

      {/* State/Province Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("auth.province")} <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedState}
          onValueChange={handleStateSelect}
          disabled={!selectedCountry || states.length === 0}
        >
          <SelectTrigger
            className={`w-full ${stateError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={t("common.selectState")} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {states.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {stateError && (
          <p className="mt-1 text-sm text-red-600">{stateError}</p>
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
          disabled={!selectedState || cities.length === 0}
        >
          <SelectTrigger
            className={`w-full ${cityError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder={t("common.selectCity")} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {cities.map((city, index) => (
              <SelectItem key={`${city.name.en}-${index}`} value={city.name.en}>
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
