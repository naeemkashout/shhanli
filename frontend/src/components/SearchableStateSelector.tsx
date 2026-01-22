import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  getStatesByCountry,
  searchStates,
  GlobalState,
} from "@/data/globalLocations";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchableStateSelectorProps {
  countryCode: string;
  value?: string; // state code
  onChange: (state: GlobalState) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableStateSelector: React.FC<
  SearchableStateSelectorProps
> = ({
  countryCode,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStates, setFilteredStates] = useState<GlobalState[]>([]);
  const [allStates, setAllStates] = useState<GlobalState[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load states when country changes
  useEffect(() => {
    if (countryCode) {
      const states = getStatesByCountry(countryCode);
      setAllStates(states);
      setFilteredStates(states);
    } else {
      setAllStates([]);
      setFilteredStates([]);
    }
    setSearchTerm("");
  }, [countryCode]);

  const selectedState = allStates.find((state) => state.code === value);

  // Filter states based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStates(allStates);
      return;
    }

    const filtered = searchStates(countryCode, searchTerm, language);
    setFilteredStates(filtered);
  }, [searchTerm, language, allStates, countryCode]);

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

  const handleSelect = (state: GlobalState) => {
    onChange(state);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled && countryCode) {
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
        disabled={disabled || !countryCode}
        className={`
          w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md
          bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${
            disabled || !countryCode
              ? "bg-gray-100 cursor-not-allowed"
              : "hover:border-gray-400 cursor-pointer"
          }
          ${language === "ar" ? "text-right" : "text-left"}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedState ? (
            <span className="truncate">{selectedState.name[language]}</span>
          ) : (
            <span className="text-gray-500 truncate">
              {placeholder || t("form.selectProvince")}
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
                placeholder={t("form.searchStates")}
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

          {/* States List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => handleSelect(state)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50
                    focus:outline-none focus:bg-gray-50 transition-colors
                    ${
                      selectedState?.code === state.code
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900"
                    }
                    ${language === "ar" ? "text-right" : "text-left"}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {state.name[language]}
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

export default SearchableStateSelector;
