import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countries, Country } from "../data/countries";
import { useLanguage } from "../contexts/LanguageContext";

interface CountrySelectorProps {
  value?: string; // country code
  onChange: (country: Country) => void;
  placeholder?: string;
  className?: string;
  showPhoneCode?: boolean;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  showPhoneCode = false,
  disabled = false,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find((country) => country.code === value);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md
          bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "hover:border-gray-400 cursor-pointer"
          }
          ${language === "ar" ? "text-right" : "text-left"}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedCountry ? (
            <>
              <span className="text-lg flex-shrink-0">
                {selectedCountry.flag}
              </span>
              <span className="truncate">{selectedCountry.name[language]}</span>
              {showPhoneCode && (
                <span className="text-gray-500 flex-shrink-0">
                  {selectedCountry.phoneCode}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500 truncate">
              {placeholder || t("form.selectCountry")}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
          absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50
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
                ref={searchInputRef}
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
                  onClick={() => handleSelect(country)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50
                    focus:outline-none focus:bg-gray-50 transition-colors
                    ${
                      selectedCountry?.code === country.code
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900"
                    }
                    ${language === "ar" ? "text-right" : "text-left"}
                  `}
                >
                  <span className="text-lg flex-shrink-0">{country.flag}</span>
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
  );
};

export default CountrySelector;
