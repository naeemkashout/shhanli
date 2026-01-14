import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";
import {
  countryTranslations,
  stateTranslations,
  cityTranslations,
} from "./translations";

export interface GlobalCountry {
  code: string;
  name: {
    ar: string;
    en: string;
  };
  flag: string;
  phoneCode: string;
}

export interface GlobalState {
  code: string;
  countryCode: string;
  name: {
    ar: string;
    en: string;
  };
}

export interface GlobalCity {
  name: {
    ar: string;
    en: string;
  };
  stateCode: string;
  countryCode: string;
}

// Get country flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Get all countries with Arabic translations
export const getAllCountries = (): GlobalCountry[] => {
  const countries = Country.getAllCountries();
  return countries.map((country: ICountry) => ({
    code: country.isoCode,
    name: {
      en: country.name,
      ar: countryTranslations[country.isoCode] || country.name,
    },
    flag: getFlagEmoji(country.isoCode),
    phoneCode: country.phonecode ? `+${country.phonecode}` : "",
  }));
};

// Get states/provinces by country code
export const getStatesByCountry = (countryCode: string): GlobalState[] => {
  const states = State.getStatesOfCountry(countryCode);
  return states.map((state: IState) => ({
    code: state.isoCode,
    countryCode: state.countryCode,
    name: {
      en: state.name,
      ar: stateTranslations[`${countryCode}_${state.isoCode}`] || state.name,
    },
  }));
};

// Get cities by country and state code
export const getCitiesByState = (
  countryCode: string,
  stateCode: string
): GlobalCity[] => {
  const cities = City.getCitiesOfState(countryCode, stateCode);
  return cities.map((city: ICity) => ({
    name: {
      en: city.name,
      ar:
        cityTranslations[`${countryCode}_${stateCode}_${city.name}`] ||
        city.name,
    },
    stateCode: city.stateCode,
    countryCode: city.countryCode,
  }));
};

// Get country by code
export const getCountryByCode = (code: string): GlobalCountry | undefined => {
  const country = Country.getCountryByCode(code);
  if (!country) return undefined;

  return {
    code: country.isoCode,
    name: {
      en: country.name,
      ar: countryTranslations[country.isoCode] || country.name,
    },
    flag: getFlagEmoji(country.isoCode),
    phoneCode: country.phonecode ? `+${country.phonecode}` : "",
  };
};

// Get state by code
export const getStateByCode = (
  countryCode: string,
  stateCode: string
): GlobalState | undefined => {
  const states = State.getStatesOfCountry(countryCode);
  const state = states.find((s: IState) => s.isoCode === stateCode);
  if (!state) return undefined;

  return {
    code: state.isoCode,
    countryCode: state.countryCode,
    name: {
      en: state.name,
      ar: stateTranslations[`${countryCode}_${stateCode}`] || state.name,
    },
  };
};

// ================ SEARCH FUNCTIONS ================

/**
 * تحسين البحث العربي - تطبيع النص العربي للبحث الدقيق
 */
const normalizeArabicText = (text: string): string => {
  return text
    .replace(/[ًٌٍَُِّْـ]/g, "") // إزالة التشكيل والتطويل
    .replace(/أ|إ|آ/g, "ا") // توحيد أشكال الألف
    .replace(/ة/g, "ه") // تحويل التاء المربوطة إلى هاء
    .replace(/ى/g, "ي") // تحويل الألف المقصورة إلى ياء
    .replace(/ئ|ؤ/g, "ء") // توحيد أشكال الهمزة
    .trim()
    .toLowerCase();
};

/**
 * وظيفة بحث محسنة للعربية والإنجليزية
 */
const advancedSearch = (text: string, query: string): boolean => {
  if (!text || !query) return false;

  const normalizedText = normalizeArabicText(text);
  const normalizedQuery = normalizeArabicText(query);

  // البحث بالعربية والإنجليزية
  return (
    text.toLowerCase().includes(query.toLowerCase()) ||
    normalizedText.includes(normalizedQuery)
  );
};

/**
 * البحث في الدول
 */
export const searchCountries = (
  query: string,
  language: "ar" | "en" = "en"
): GlobalCountry[] => {
  if (!query.trim()) {
    return getAllCountries();
  }

  const allCountries = getAllCountries();
  const searchQuery = query.trim();

  return allCountries.filter((country) => {
    // البحث بالاسم العربي
    if (advancedSearch(country.name.ar, searchQuery)) return true;

    // البحث بالاسم الإنجليزي
    if (advancedSearch(country.name.en, searchQuery)) return true;

    // البحث بالرمز (مثل SA, US)
    if (country.code.toLowerCase().includes(searchQuery.toLowerCase()))
      return true;

    // البحث برمز الهاتف
    if (country.phoneCode.includes(searchQuery)) return true;

    // البحث برمز الهاتف بدون علامة +
    if (country.phoneCode.replace("+", "").includes(searchQuery)) return true;

    return false;
  });
};

/**
 * البحث في المحافظات
 */
export const searchStates = (
  countryCode: string,
  query: string,
  language: "ar" | "en" = "en"
): GlobalState[] => {
  if (!query.trim()) {
    return getStatesByCountry(countryCode);
  }

  const allStates = getStatesByCountry(countryCode);
  const searchQuery = query.trim();

  return allStates.filter((state) => {
    // البحث بالاسم العربي
    if (advancedSearch(state.name.ar, searchQuery)) return true;

    // البحث بالاسم الإنجليزي
    if (advancedSearch(state.name.en, searchQuery)) return true;

    // البحث بالرمز
    if (state.code.toLowerCase().includes(searchQuery.toLowerCase()))
      return true;

    return false;
  });
};

/**
 * البحث في المدن
 */
export const searchCities = (
  countryCode: string,
  stateCode: string,
  query: string,
  language: "ar" | "en" = "en"
): GlobalCity[] => {
  if (!query.trim()) {
    return getCitiesByState(countryCode, stateCode);
  }

  const allCities = getCitiesByState(countryCode, stateCode);
  const searchQuery = query.trim();

  return allCities.filter((city) => {
    // البحث بالاسم العربي
    if (advancedSearch(city.name.ar, searchQuery)) return true;

    // البحث بالاسم الإنجليزي
    if (advancedSearch(city.name.en, searchQuery)) return true;

    return false;
  });
};

/**
 * بحث شامل في جميع المواقع (دول، محافظات، مدن)
 */
export const searchAllLocations = (
  query: string,
  language: "ar" | "en" = "en"
): {
  countries: GlobalCountry[];
  states: GlobalState[];
  cities: GlobalCity[];
} => {
  if (!query.trim()) {
    return {
      countries: getAllCountries(),
      states: [],
      cities: [],
    };
  }

  const searchQuery = query.trim();
  const results = {
    countries: [] as GlobalCountry[],
    states: [] as GlobalState[],
    cities: [] as GlobalCity[],
  };

  // البحث في الدول
  results.countries = searchCountries(searchQuery, language);

  // البحث في المحافظات عبر جميع الدول
  const allCountries = getAllCountries();
  allCountries.forEach((country) => {
    const countryStates = getStatesByCountry(country.code);
    const filteredStates = countryStates.filter((state) => {
      if (advancedSearch(state.name.ar, searchQuery)) return true;
      if (advancedSearch(state.name.en, searchQuery)) return true;
      if (state.code.toLowerCase().includes(searchQuery.toLowerCase()))
        return true;
      return false;
    });
    results.states.push(...filteredStates);
  });

  // البحث في المدن عبر جميع المحافظات والدول
  allCountries.forEach((country) => {
    const countryStates = getStatesByCountry(country.code);
    countryStates.forEach((state) => {
      const stateCities = getCitiesByState(country.code, state.code);
      const filteredCities = stateCities.filter((city) => {
        if (advancedSearch(city.name.ar, searchQuery)) return true;
        if (advancedSearch(city.name.en, searchQuery)) return true;
        return false;
      });
      results.cities.push(...filteredCities);
    });
  });

  return results;
};

/**
 * البحث الذكي مع اقتراحات
 */
export const smartSearch = (
  query: string,
  maxResults: number = 10
): Array<{
  type: "country" | "state" | "city";
  name: string;
  code: string;
  flag?: string;
  fullName: string;
}> => {
  if (!query.trim()) {
    return [];
  }

  const searchQuery = query.trim().toLowerCase();
  const results: Array<{
    type: "country" | "state" | "city";
    name: string;
    code: string;
    flag?: string;
    fullName: string;
  }> = [];

  // البحث في الدول
  const countries = searchCountries(searchQuery);
  countries.slice(0, maxResults).forEach((country) => {
    results.push({
      type: "country",
      name: country.name.ar,
      code: country.code,
      flag: country.flag,
      fullName: `${country.name.ar} (${country.code})`,
    });
  });

  // إذا لم نصل للحد الأقصى، نبحث في المحافظات
  if (results.length < maxResults) {
    const allCountries = getAllCountries();
    for (const country of allCountries) {
      if (results.length >= maxResults) break;

      const states = searchStates(country.code, searchQuery);
      states.slice(0, maxResults - results.length).forEach((state) => {
        results.push({
          type: "state",
          name: state.name.ar,
          code: state.code,
          fullName: `${state.name.ar}, ${country.name.ar}`,
        });
      });
    }
  }

  // إذا لم نصل للحد الأقصى، نبحث في المدن
  if (results.length < maxResults) {
    const allCountries = getAllCountries();
    for (const country of allCountries) {
      if (results.length >= maxResults) break;

      const states = getStatesByCountry(country.code);
      for (const state of states) {
        if (results.length >= maxResults) break;

        const cities = searchCities(country.code, state.code, searchQuery);
        cities.slice(0, maxResults - results.length).forEach((city) => {
          results.push({
            type: "city",
            name: city.name.ar,
            code: city.name.ar,
            fullName: `${city.name.ar}, ${state.name.ar}, ${country.name.ar}`,
          });
        });
      }
    }
  }

  return results.slice(0, maxResults);
};

/**
 * الحصول على دول شائعة (للشرق الأوسط)
 */
export const getPopularCountries = (): GlobalCountry[] => {
  const popularCodes = ["SA", "AE", "EG", "KW", "QA", "BH", "OM", "JO"];
  const allCountries = getAllCountries();

  return allCountries
    .filter((country) => popularCodes.includes(country.code))
    .sort(
      (a, b) => popularCodes.indexOf(a.code) - popularCodes.indexOf(b.code)
    );
};

/**
 * الحصول على اقتراحات البحث
 */
export const getSearchSuggestions = (
  query: string,
  language: "ar" | "en" = "en"
): string[] => {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();
  const searchQuery = query.trim().toLowerCase();

  // اقتراحات من الدول
  const countries = getAllCountries();
  countries.forEach((country) => {
    if (country.name.ar.toLowerCase().includes(searchQuery)) {
      suggestions.add(country.name.ar);
    }
    if (country.name.en.toLowerCase().includes(searchQuery)) {
      suggestions.add(country.name.en);
    }
  });

  // اقتراحات من المحافظات
  const allCountries = getAllCountries();
  allCountries.forEach((country) => {
    const states = getStatesByCountry(country.code);
    states.forEach((state) => {
      if (state.name.ar.toLowerCase().includes(searchQuery)) {
        suggestions.add(state.name.ar);
      }
      if (state.name.en.toLowerCase().includes(searchQuery)) {
        suggestions.add(state.name.en);
      }
    });
  });

  return Array.from(suggestions).slice(0, 5);
};

/**
 * تصفية الدول بحرف معين
 */
export const filterCountriesByLetter = (
  letter: string,
  language: "ar" | "en" = "ar"
): GlobalCountry[] => {
  if (!letter || letter.length !== 1) {
    return [];
  }

  const allCountries = getAllCountries();

  return allCountries.filter((country) => {
    const name = country.name[language];
    return name.startsWith(letter) || name.startsWith(letter.toUpperCase());
  });
};

// تصدير جميع دوال البحث
export const Search = {
  searchCountries,
  searchStates,
  searchCities,
  searchAllLocations,
  smartSearch,
  getPopularCountries,
  getSearchSuggestions,
  filterCountriesByLetter,
  normalizeArabic: normalizeArabicText,
};
