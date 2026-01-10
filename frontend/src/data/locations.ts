export interface Province {
  code: string;
  name: {
    ar: string;
    en: string;
  };
  cities: City[];
}

export interface City {
  code: string;
  name: {
    ar: string;
    en: string;
  };
}

export interface CountryWithProvinces {
  code: string;
  name: {
    ar: string;
    en: string;
  };
  flag: string;
  phoneCode: string;
  provinces: Province[];
}

export const countriesWithProvinces: CountryWithProvinces[] = [
  {
    code: "SA",
    name: { ar: "السعودية", en: "Saudi Arabia" },
    flag: "🇸🇦",
    phoneCode: "+966",
    provinces: [
      {
        code: "RUH",
        name: { ar: "الرياض", en: "Riyadh" },
        cities: [
          { code: "RUH_CITY", name: { ar: "الرياض", en: "Riyadh" } },
          { code: "KHARJ", name: { ar: "الخرج", en: "Al Kharj" } },
          { code: "DAWADMI", name: { ar: "الدوادمي", en: "Ad Dawadmi" } },
          { code: "MAJMAAH", name: { ar: "المجمعة", en: "Al Majmaah" } },
          { code: "QUWAYIYAH", name: { ar: "القويعية", en: "Al Quwayiyah" } },
        ],
      },
      {
        code: "MAK",
        name: { ar: "مكة المكرمة", en: "Makkah" },
        cities: [
          { code: "MAKKAH", name: { ar: "مكة المكرمة", en: "Makkah" } },
          { code: "JEDDAH", name: { ar: "جدة", en: "Jeddah" } },
          { code: "TAIF", name: { ar: "الطائف", en: "Taif" } },
          { code: "RABIGH", name: { ar: "رابغ", en: "Rabigh" } },
          { code: "KHULAIS", name: { ar: "خليص", en: "Khulais" } },
        ],
      },
      {
        code: "MAD",
        name: { ar: "المدينة المنورة", en: "Madinah" },
        cities: [
          { code: "MADINAH", name: { ar: "المدينة المنورة", en: "Madinah" } },
          { code: "YANBU", name: { ar: "ينبع", en: "Yanbu" } },
          { code: "BADR", name: { ar: "بدر", en: "Badr" } },
          { code: "KHAYBAR", name: { ar: "خيبر", en: "Khaybar" } },
        ],
      },
      {
        code: "EAS",
        name: { ar: "المنطقة الشرقية", en: "Eastern Province" },
        cities: [
          { code: "DAMMAM", name: { ar: "الدمام", en: "Dammam" } },
          { code: "KHOBAR", name: { ar: "الخبر", en: "Al Khobar" } },
          { code: "DHAHRAN", name: { ar: "الظهران", en: "Dhahran" } },
          { code: "JUBAIL", name: { ar: "الجبيل", en: "Jubail" } },
          { code: "QATIF", name: { ar: "القطيف", en: "Qatif" } },
        ],
      },
    ],
  },
  {
    code: "AE",
    name: { ar: "الإمارات العربية المتحدة", en: "United Arab Emirates" },
    flag: "🇦🇪",
    phoneCode: "+971",
    provinces: [
      {
        code: "DXB",
        name: { ar: "دبي", en: "Dubai" },
        cities: [
          { code: "DUBAI_CITY", name: { ar: "دبي", en: "Dubai" } },
          { code: "HATTA", name: { ar: "حتا", en: "Hatta" } },
        ],
      },
      {
        code: "AUH",
        name: { ar: "أبوظبي", en: "Abu Dhabi" },
        cities: [
          { code: "ABU_DHABI", name: { ar: "أبوظبي", en: "Abu Dhabi" } },
          { code: "AL_AIN", name: { ar: "العين", en: "Al Ain" } },
          { code: "LIWA", name: { ar: "ليوا", en: "Liwa" } },
        ],
      },
      {
        code: "SHJ",
        name: { ar: "الشارقة", en: "Sharjah" },
        cities: [
          { code: "SHARJAH_CITY", name: { ar: "الشارقة", en: "Sharjah" } },
          { code: "KHOR_FAKKAN", name: { ar: "خورفكان", en: "Khor Fakkan" } },
          { code: "KALBA", name: { ar: "كلباء", en: "Kalba" } },
        ],
      },
      {
        code: "AJM",
        name: { ar: "عجمان", en: "Ajman" },
        cities: [{ code: "AJMAN_CITY", name: { ar: "عجمان", en: "Ajman" } }],
      },
    ],
  },
  {
    code: "EG",
    name: { ar: "مصر", en: "Egypt" },
    flag: "🇪🇬",
    phoneCode: "+20",
    provinces: [
      {
        code: "CAI",
        name: { ar: "القاهرة", en: "Cairo" },
        cities: [
          { code: "CAIRO_CITY", name: { ar: "القاهرة", en: "Cairo" } },
          { code: "HELIOPOLIS", name: { ar: "مصر الجديدة", en: "Heliopolis" } },
          { code: "MAADI", name: { ar: "المعادي", en: "Maadi" } },
          { code: "NASR_CITY", name: { ar: "مدينة نصر", en: "Nasr City" } },
        ],
      },
      {
        code: "GIZ",
        name: { ar: "الجيزة", en: "Giza" },
        cities: [
          { code: "GIZA_CITY", name: { ar: "الجيزة", en: "Giza" } },
          { code: "DOKKI", name: { ar: "الدقي", en: "Dokki" } },
          { code: "MOHANDESSIN", name: { ar: "المهندسين", en: "Mohandessin" } },
          {
            code: "SIXTH_OCTOBER",
            name: { ar: "السادس من أكتوبر", en: "6th of October" },
          },
        ],
      },
      {
        code: "ALX",
        name: { ar: "الإسكندرية", en: "Alexandria" },
        cities: [
          {
            code: "ALEXANDRIA_CITY",
            name: { ar: "الإسكندرية", en: "Alexandria" },
          },
          {
            code: "BORG_EL_ARAB",
            name: { ar: "برج العرب", en: "Borg El Arab" },
          },
          { code: "MONTAZA", name: { ar: "المنتزه", en: "Montaza" } },
        ],
      },
    ],
  },
  {
    code: "JO",
    name: { ar: "الأردن", en: "Jordan" },
    flag: "🇯🇴",
    phoneCode: "+962",
    provinces: [
      {
        code: "AMM",
        name: { ar: "عمان", en: "Amman" },
        cities: [
          { code: "AMMAN_CITY", name: { ar: "عمان", en: "Amman" } },
          { code: "ZARQA", name: { ar: "الزرقاء", en: "Zarqa" } },
          { code: "RUSSEIFA", name: { ar: "الرصيفة", en: "Russeifa" } },
        ],
      },
      {
        code: "IRB",
        name: { ar: "إربد", en: "Irbid" },
        cities: [
          { code: "IRBID_CITY", name: { ar: "إربد", en: "Irbid" } },
          { code: "RAMTHA", name: { ar: "الرمثا", en: "Ramtha" } },
          { code: "MAFRAQ", name: { ar: "المفرق", en: "Mafraq" } },
        ],
      },
      {
        code: "AQB",
        name: { ar: "العقبة", en: "Aqaba" },
        cities: [{ code: "AQABA_CITY", name: { ar: "العقبة", en: "Aqaba" } }],
      },
    ],
  },
  {
    code: "LB",
    name: { ar: "لبنان", en: "Lebanon" },
    flag: "🇱🇧",
    phoneCode: "+961",
    provinces: [
      {
        code: "BEI",
        name: { ar: "بيروت", en: "Beirut" },
        cities: [{ code: "BEIRUT_CITY", name: { ar: "بيروت", en: "Beirut" } }],
      },
      {
        code: "MOU",
        name: { ar: "جبل لبنان", en: "Mount Lebanon" },
        cities: [
          { code: "JOUNIEH", name: { ar: "جونية", en: "Jounieh" } },
          { code: "BAABDA", name: { ar: "بعبدا", en: "Baabda" } },
          { code: "ALEY", name: { ar: "عاليه", en: "Aley" } },
          { code: "METN", name: { ar: "المتن", en: "Metn" } },
        ],
      },
      {
        code: "TRI",
        name: { ar: "طرابلس", en: "Tripoli" },
        cities: [
          { code: "TRIPOLI_CITY", name: { ar: "طرابلس", en: "Tripoli" } },
          { code: "MINA", name: { ar: "الميناء", en: "Mina" } },
        ],
      },
    ],
  },
  {
    code: "SY",
    name: { ar: "سوريا", en: "Syria" },
    flag: "🇸🇾",
    phoneCode: "+963",
    provinces: [
      {
        code: "DAM",
        name: { ar: "دمشق", en: "Damascus" },
        cities: [
          { code: "DAMASCUS_CITY", name: { ar: "دمشق", en: "Damascus" } },
          { code: "SAHNAYA", name: { ar: "صحنايا", en: "Sahnaya" } },
          { code: "DARAYA", name: { ar: "داريا", en: "Daraya" } },
        ],
      },
      {
        code: "ALE",
        name: { ar: "حلب", en: "Aleppo" },
        cities: [
          { code: "ALEPPO_CITY", name: { ar: "حلب", en: "Aleppo" } },
          { code: "AFRIN", name: { ar: "عفرين", en: "Afrin" } },
          { code: "AZAZ", name: { ar: "أعزاز", en: "Azaz" } },
        ],
      },
      {
        code: "LAT",
        name: { ar: "اللاذقية", en: "Latakia" },
        cities: [
          { code: "LATAKIA_CITY", name: { ar: "اللاذقية", en: "Latakia" } },
          { code: "JABLEH", name: { ar: "جبلة", en: "Jableh" } },
          { code: "QARDAHA", name: { ar: "القرداحة", en: "Qardaha" } },
        ],
      },
      {
        code: "HOM",
        name: { ar: "حمص", en: "Homs" },
        cities: [
          { code: "HOMS_CITY", name: { ar: "حمص", en: "Homs" } },
          { code: "PALMYRA", name: { ar: "تدمر", en: "Palmyra" } },
          { code: "QUSAYR", name: { ar: "القصير", en: "Al-Qusayr" } },
        ],
      },
    ],
  },
  {
    code: "IQ",
    name: { ar: "العراق", en: "Iraq" },
    flag: "🇮🇶",
    phoneCode: "+964",
    provinces: [
      {
        code: "BAG",
        name: { ar: "بغداد", en: "Baghdad" },
        cities: [
          { code: "BAGHDAD_CITY", name: { ar: "بغداد", en: "Baghdad" } },
          { code: "SADR_CITY", name: { ar: "مدينة الصدر", en: "Sadr City" } },
          { code: "KADHIMIYA", name: { ar: "الكاظمية", en: "Kadhimiya" } },
        ],
      },
      {
        code: "BAS",
        name: { ar: "البصرة", en: "Basra" },
        cities: [
          { code: "BASRA_CITY", name: { ar: "البصرة", en: "Basra" } },
          { code: "ZUBAIR", name: { ar: "الزبير", en: "Az Zubayr" } },
          { code: "UMM_QASR", name: { ar: "أم قصر", en: "Umm Qasr" } },
        ],
      },
      {
        code: "ERB",
        name: { ar: "أربيل", en: "Erbil" },
        cities: [
          { code: "ERBIL_CITY", name: { ar: "أربيل", en: "Erbil" } },
          { code: "SHAQLAWA", name: { ar: "شقلاوة", en: "Shaqlawa" } },
          { code: "KOYA", name: { ar: "كويه", en: "Koya" } },
        ],
      },
    ],
  },
  {
    code: "KW",
    name: { ar: "الكويت", en: "Kuwait" },
    flag: "🇰🇼",
    phoneCode: "+965",
    provinces: [
      {
        code: "CAP",
        name: { ar: "العاصمة", en: "Capital" },
        cities: [
          {
            code: "KUWAIT_CITY",
            name: { ar: "مدينة الكويت", en: "Kuwait City" },
          },
          { code: "SHUWAIKH", name: { ar: "الشويخ", en: "Shuwaikh" } },
          { code: "DASMAN", name: { ar: "دسمان", en: "Dasman" } },
        ],
      },
      {
        code: "HAW",
        name: { ar: "حولي", en: "Hawalli" },
        cities: [
          { code: "HAWALLI_CITY", name: { ar: "حولي", en: "Hawalli" } },
          { code: "SALMIYA", name: { ar: "السالمية", en: "Salmiya" } },
          { code: "RUMAITHIYA", name: { ar: "الرميثية", en: "Rumaithiya" } },
        ],
      },
      {
        code: "FAR",
        name: { ar: "الفروانية", en: "Farwaniya" },
        cities: [
          {
            code: "FARWANIYA_CITY",
            name: { ar: "الفروانية", en: "Farwaniya" },
          },
          {
            code: "JLEEB",
            name: { ar: "جليب الشيوخ", en: "Jleeb Al-Shuyoukh" },
          },
          { code: "RABIYA", name: { ar: "الرابية", en: "Rabiya" } },
        ],
      },
    ],
  },
  {
    code: "QA",
    name: { ar: "قطر", en: "Qatar" },
    flag: "🇶🇦",
    phoneCode: "+974",
    provinces: [
      {
        code: "DOH",
        name: { ar: "الدوحة", en: "Doha" },
        cities: [
          { code: "DOHA_CITY", name: { ar: "الدوحة", en: "Doha" } },
          { code: "WEST_BAY", name: { ar: "الخليج الغربي", en: "West Bay" } },
          { code: "OLD_DOHA", name: { ar: "الدوحة القديمة", en: "Old Doha" } },
        ],
      },
      {
        code: "RAY",
        name: { ar: "الريان", en: "Al Rayyan" },
        cities: [
          { code: "AL_RAYYAN", name: { ar: "الريان", en: "Al Rayyan" } },
          { code: "LUSAIL", name: { ar: "لوسيل", en: "Lusail" } },
          { code: "AL_GHARAFA", name: { ar: "الغرافة", en: "Al Gharafa" } },
        ],
      },
    ],
  },
  {
    code: "BH",
    name: { ar: "البحرين", en: "Bahrain" },
    flag: "🇧🇭",
    phoneCode: "+973",
    provinces: [
      {
        code: "CAP",
        name: { ar: "العاصمة", en: "Capital" },
        cities: [
          { code: "MANAMA", name: { ar: "المنامة", en: "Manama" } },
          { code: "MUHARRAQ", name: { ar: "المحرق", en: "Muharraq" } },
          { code: "RIFFA", name: { ar: "الرفاع", en: "Riffa" } },
        ],
      },
      {
        code: "NOR",
        name: { ar: "الشمالية", en: "Northern" },
        cities: [
          { code: "HAMAD_TOWN", name: { ar: "مدينة حمد", en: "Hamad Town" } },
          { code: "A_ALI", name: { ar: "عالي", en: "A'ali" } },
          { code: "BUDAIYA", name: { ar: "البديع", en: "Budaiya" } },
        ],
      },
    ],
  },
  {
    code: "OM",
    name: { ar: "عمان", en: "Oman" },
    flag: "🇴🇲",
    phoneCode: "+968",
    provinces: [
      {
        code: "MUS",
        name: { ar: "مسقط", en: "Muscat" },
        cities: [
          { code: "MUSCAT_CITY", name: { ar: "مسقط", en: "Muscat" } },
          { code: "MUTRAH", name: { ar: "مطرح", en: "Mutrah" } },
          { code: "RUWI", name: { ar: "روي", en: "Ruwi" } },
          { code: "SEEB", name: { ar: "السيب", en: "Seeb" } },
        ],
      },
      {
        code: "SUR",
        name: { ar: "صور", en: "Sur" },
        cities: [
          { code: "SUR_CITY", name: { ar: "صور", en: "Sur" } },
          { code: "IBRA", name: { ar: "إبراء", en: "Ibra" } },
          { code: "QURIYAT", name: { ar: "قريات", en: "Quriyat" } },
        ],
      },
      {
        code: "SAL",
        name: { ar: "صلالة", en: "Salalah" },
        cities: [
          { code: "SALALAH_CITY", name: { ar: "صلالة", en: "Salalah" } },
          { code: "MIRBAT", name: { ar: "مرباط", en: "Mirbat" } },
          { code: "TAQAH", name: { ar: "طاقة", en: "Taqah" } },
        ],
      },
    ],
  },
];

export const getProvincesByCountry = (countryCode: string): Province[] => {
  const country = countriesWithProvinces.find((c) => c.code === countryCode);
  return country ? country.provinces : [];
};

export const getCitiesByProvince = (
  countryCode: string,
  provinceCode: string
): City[] => {
  const country = countriesWithProvinces.find((c) => c.code === countryCode);
  if (!country) return [];

  const province = country.provinces.find((p) => p.code === provinceCode);
  return province ? province.cities : [];
};

export const getCountryByCode = (
  code: string
): CountryWithProvinces | undefined => {
  return countriesWithProvinces.find((c) => c.code === code);
};

export const getProvinceByCode = (
  countryCode: string,
  provinceCode: string
): Province | undefined => {
  const country = getCountryByCode(countryCode);
  if (!country) return undefined;
  return country.provinces.find((p) => p.code === provinceCode);
};

export const getCityByCode = (
  countryCode: string,
  provinceCode: string,
  cityCode: string
): City | undefined => {
  const cities = getCitiesByProvince(countryCode, provinceCode);
  return cities.find((c) => c.code === cityCode);
};
