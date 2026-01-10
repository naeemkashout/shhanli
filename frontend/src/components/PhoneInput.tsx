import React, { useState, useEffect } from "react";
import { countries, Country, getCountryByPhoneCode } from "../data/countries";
import { useLanguage } from "../contexts/LanguageContext";
import { ChevronDown, Search } from "lucide-react";

interface PhoneInputProps {
  value?: string;
  onChange: (value: string, country?: Country) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string; // country code
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  placeholder,
  className = "",
  disabled = false,
  defaultCountry = "SA", // Default to Saudi Arabia
}) => {
  const { language, t } = useLanguage();
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((c) => c.code === defaultCountry) || countries[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Try to extract country code and phone number from the value
      const country = countries.find((c) => value.startsWith(c.phoneCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.phoneCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Filter countries based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCountries(countries);
      return;
    }

    const filtered = countries.filter((country) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        country.name[language].toLowerCase().includes(searchLower) ||
        country.name.en.toLowerCase().includes(searchLower) ||
        country.name.ar.includes(searchTerm) ||
        country.phoneCode.includes(searchTerm) ||
        country.code.toLowerCase().includes(searchLower)
      );
    });

    setFilteredCountries(filtered);
  }, [searchTerm, language]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    setSearchTerm("");

    // Update the full phone number
    const fullNumber = phoneNumber
      ? `${country.phoneCode}${phoneNumber}`
      : country.phoneCode;
    onChange(fullNumber, country);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/[^\d]/g, ""); // Only allow digits
    setPhoneNumber(number);

    const fullNumber = number
      ? `${selectedCountry.phoneCode}${number}`
      : selectedCountry.phoneCode;
    onChange(fullNumber, selectedCountry);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              !disabled && setIsCountryDropdownOpen(!isCountryDropdownOpen)
            }
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white
              ${
                language === "ar"
                  ? "rounded-r-md border-l-0"
                  : "rounded-l-md border-r-0"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${
                disabled
                  ? "bg-gray-100 cursor-not-allowed"
                  : "hover:border-gray-400 cursor-pointer"
              }
              min-w-0 flex-shrink-0
            `}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {selectedCountry.phoneCode}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isCountryDropdownOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {/* Country Dropdown */}
          {isCountryDropdownOpen && (
            <div
              className={`
              absolute top-full mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50
              max-h-60 overflow-hidden
              ${language === "ar" ? "right-0" : "left-0"}
            `}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search
                    className={`
                    absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400
                    ${language === "ar" ? "right-3" : "left-3"}
                  `}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("form.searchCountries")}
                    className={`
                      w-full py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${
                        language === "ar"
                          ? "pr-10 pl-3 text-right"
                          : "pl-10 pr-3 text-left"
                      }
                    `}
                  />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50
                        focus:outline-none focus:bg-gray-50 transition-colors
                        ${
                          selectedCountry.code === country.code
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-900"
                        }
                        ${language === "ar" ? "text-right" : "text-left"}
                      `}
                    >
                      <span className="text-lg flex-shrink-0">
                        {country.flag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">
                          {country.name[language]}
                        </div>
                      </div>
                      <span className="text-gray-500 text-xs flex-shrink-0">
                        {country.phoneCode}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    {t("common.noResults")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder || t("form.enterPhone")}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${
              language === "ar"
                ? "rounded-l-md text-right"
                : "rounded-r-md text-left"
            }
            ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          `}
          dir={language === "ar" ? "rtl" : "ltr"}
        />
      </div>

      {/* Click outside handler */}
      {isCountryDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsCountryDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default PhoneInput;
