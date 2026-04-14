const DIGIT_PATCH_FLAG = "__kashout_latin_digits_enforced__";

const enforceLatnInLocale = (locale: string) => {
  if (!locale) return locale;

  if (/[-_]u-.*-nu-latn\b/i.test(locale)) {
    return locale;
  }

  if (/-u-/i.test(locale)) {
    if (/-nu-[a-z0-9]+/i.test(locale)) {
      return locale.replace(/-nu-[a-z0-9]+/i, "-nu-latn");
    }

    return `${locale}-nu-latn`;
  }

  return `${locale}-u-nu-latn`;
};

const normalizeLocales = (locales?: string | string[]) => {
  if (!locales) return locales;
  if (Array.isArray(locales)) {
    return locales.map((locale) => enforceLatnInLocale(String(locale)));
  }

  return enforceLatnInLocale(String(locales));
};

const withLatnOptions = <T extends Record<string, any> | undefined>(
  options: T,
) => ({
  ...(options || {}),
  numberingSystem: "latn",
});

export const enforceLatinDigitsGlobally = () => {
  const globalScope = globalThis as any;
  if (globalScope[DIGIT_PATCH_FLAG]) return;

  const OriginalNumberFormat = Intl.NumberFormat;
  const OriginalDateTimeFormat = Intl.DateTimeFormat;
  const originalNumberToLocaleString = Number.prototype.toLocaleString;
  const originalDateToLocaleString = Date.prototype.toLocaleString;
  const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
  const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;

  const PatchedNumberFormat = function (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions,
  ) {
    return new OriginalNumberFormat(
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  } as unknown as typeof Intl.NumberFormat;

  PatchedNumberFormat.prototype = OriginalNumberFormat.prototype;
  Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);

  const PatchedDateTimeFormat = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new OriginalDateTimeFormat(
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  } as unknown as typeof Intl.DateTimeFormat;

  PatchedDateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
  Object.setPrototypeOf(PatchedDateTimeFormat, OriginalDateTimeFormat);

  (Intl as any).NumberFormat = PatchedNumberFormat;
  (Intl as any).DateTimeFormat = PatchedDateTimeFormat;

  Number.prototype.toLocaleString = function (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions,
  ) {
    return originalNumberToLocaleString.call(
      this,
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  };

  Date.prototype.toLocaleString = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ) {
    return originalDateToLocaleString.call(
      this,
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  };

  Date.prototype.toLocaleDateString = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ) {
    return originalDateToLocaleDateString.call(
      this,
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  };

  Date.prototype.toLocaleTimeString = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ) {
    return originalDateToLocaleTimeString.call(
      this,
      normalizeLocales(locales),
      withLatnOptions(options),
    );
  };

  globalScope[DIGIT_PATCH_FLAG] = true;
};
