import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  getCitiesByState,
  searchCities,
  GlobalCity,
} from "@/data/globalLocations";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchableCitySelectorProps {
  countryCode: string;
  stateCode: string;
  value?: string; // city name
  onChange: (city: GlobalCity) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableCitySelector: React.FC<SearchableCitySelectorProps> = ({
  countryCode,
  stateCode,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<GlobalCity[]>([]);
  const [allCities, setAllCities] = useState<GlobalCity[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load cities when state changes
  useEffect(() => {
    if (countryCode && stateCode) {
      const cities = getCitiesByState(countryCode, stateCode);
      setAllCities(cities);
      setFilteredCities(cities);
    } else {
      setAllCities([]);
      setFilteredCities([]);
    }
    setSearchTerm("");
  }, [countryCode, stateCode]);

  const selectedCity = allCities.find((city) => city.name.en === value);

  // Filter cities based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCities(allCities);
      return;
    }

    const filtered = searchCities(countryCode, stateCode, searchTerm, language);
    setFilteredCities(filtered);
  }, [searchTerm, language, allCities, countryCode, stateCode]);

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

  const handleSelect = (city: GlobalCity) => {
    onChange(city);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled && countryCode && stateCode) {
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
        disabled={disabled || !stateCode}
        className={`
          w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md
          bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${
            disabled || !stateCode
              ? "bg-gray-100 cursor-not-allowed"
              : "hover:border-gray-400 cursor-pointer"
          }
          ${language === "ar" ? "text-right" : "text-left"}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedCity ? (
            <span className="truncate">{selectedCity.name[language]}</span>
          ) : (
            <span className="text-gray-500 truncate">
              {placeholder || t("form.enterCity")}
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
                placeholder={t("form.searchCities")}
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

          {/* Cities List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <button
                  key={`${city.name.en}-${index}`}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50
                    focus:outline-none focus:bg-gray-50 transition-colors
                    ${
                      selectedCity?.name.en === city.name.en
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900"
                    }
                    ${language === "ar" ? "text-right" : "text-left"}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {city.name[language]}
                    </div>
                  </div>
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

export default SearchableCitySelector;
