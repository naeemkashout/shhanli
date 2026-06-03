import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import shippingCompanyService from "@/services/shippingCompanyService";
import { useLanguage } from "@/contexts/LanguageContext";

type CompanyOffer = {
  _id?: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaTextEn?: string;
  ctaLink?: string;
  background?: string;
  localPriceSYP?: number;
  localPriceUSD?: number;
  internationalPriceSYP?: number;
  internationalPriceUSD?: number;
  codFeeSYP?: number;
  codFeeUSD?: number;
  expressFeeSYP?: number;
  expressFeeUSD?: number;
  packagingFeeSYP?: number;
  packagingFeeUSD?: number;
  durationDays?: number;
  durationHours?: number;
  priority?: number;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
};

type Company = {
  _id: string;
  name: string;
  offers?: CompanyOffer[];
};

type Slide = CompanyOffer & {
  companyId: string;
  companyName: string;
};

type WelcomePageProps = {
  embedded?: boolean;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
};

export default function WelcomePage({
  embedded = false,
  autoPlay = true,
  autoPlayIntervalMs = 3500,
}: WelcomePageProps) {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setIsLoading(true);
        const companies =
          (await shippingCompanyService.getShippingCompanies()) as Company[];

        const now = Date.now();
        const nextSlides = (companies || [])
          .flatMap((company) =>
            (company.offers || []).map((offer) => ({
              ...offer,
              companyId: company._id,
              companyName: company.name,
            })),
          )
          .filter((offer) => {
            if (!offer?.isActive) return false;
            if (!String(offer.title || offer.titleEn || "").trim())
              return false;

            const startAt = offer.startAt
              ? new Date(offer.startAt).getTime()
              : null;
            const endAt = offer.endAt ? new Date(offer.endAt).getTime() : null;

            if (startAt && !Number.isNaN(startAt) && startAt > now)
              return false;
            if (endAt && !Number.isNaN(endAt) && endAt < now) return false;
            return true;
          })
          .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

        setSlides(nextSlides);
      } catch {
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOffers();
  }, []);

  useEffect(() => {
    if (!autoPlay) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, autoPlayIntervalMs);

    return () => window.clearInterval(timer);
  }, [autoPlay, autoPlayIntervalMs]);

  const getOfferText = (
    slide: Slide,
    field: "title" | "subtitle" | "ctaText",
  ) => {
    const englishField = `${field}En` as "titleEn" | "subtitleEn" | "ctaTextEn";
    const primary =
      language === "ar"
        ? String(slide[field] || "").trim()
        : String(slide[englishField] || "").trim();
    const fallback =
      language === "ar"
        ? String(slide[englishField] || "").trim()
        : String(slide[field] || "").trim();

    return primary || fallback;
  };

  const getOfferDescription = (slide: Slide) => {
    const primary =
      language === "ar"
        ? String(slide.description || "").trim()
        : String(slide.descriptionEn || "").trim();
    const fallback =
      language === "ar"
        ? String(slide.descriptionEn || "").trim()
        : String(slide.description || "").trim();

    return primary || fallback;
  };

  const formatCurrency = (amount: number, currency: "SYP" | "USD") => {
    if (currency === "SYP") {
      return `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(Number(amount || 0))} ${language === "ar" ? "ل.س" : "SYP"}`;
    }

    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0))} $`;
  };

  const offerPriceItems = (slide: Slide) =>
    [
      {
        label: tr("السعر المحلي", "Local price"),
        value: Number(slide.localPriceSYP || slide.localPriceUSD || 0)
          ? formatCurrency(Number(slide.localPriceSYP || 0), "SYP") ||
            formatCurrency(Number(slide.localPriceUSD || 0), "USD")
          : null,
        fallback: slide.localPriceUSD
          ? formatCurrency(Number(slide.localPriceUSD), "USD")
          : null,
      },
      {
        label: tr("السعر الدولي", "International price"),
        value: Number(
          slide.internationalPriceUSD || slide.internationalPriceSYP || 0,
        )
          ? formatCurrency(Number(slide.internationalPriceUSD || 0), "USD") ||
            formatCurrency(Number(slide.internationalPriceSYP || 0), "SYP")
          : null,
        fallback: slide.internationalPriceSYP
          ? formatCurrency(Number(slide.internationalPriceSYP), "SYP")
          : null,
      },
      {
        label: "COD",
        value: Number(slide.codFeeSYP || slide.codFeeUSD || 0)
          ? `${formatCurrency(Number(slide.codFeeSYP || 0), "SYP")} | ${formatCurrency(Number(slide.codFeeUSD || 0), "USD")}`
          : null,
        fallback: null,
      },
      {
        label: tr("السريع", "Express"),
        value: Number(slide.expressFeeSYP || slide.expressFeeUSD || 0)
          ? `${formatCurrency(Number(slide.expressFeeSYP || 0), "SYP")} | ${formatCurrency(Number(slide.expressFeeUSD || 0), "USD")}`
          : null,
        fallback: null,
      },
      {
        label: tr("التغليف", "Packaging"),
        value: Number(slide.packagingFeeSYP || slide.packagingFeeUSD || 0)
          ? `${formatCurrency(Number(slide.packagingFeeSYP || 0), "SYP")} | ${formatCurrency(Number(slide.packagingFeeUSD || 0), "USD")}`
          : null,
        fallback: null,
      },
      {
        label: tr("المدة", "Duration"),
        value: [slide.durationDays, slide.durationHours].some(
          (part) => Number(part || 0) > 0,
        )
          ? [
              Number(slide.durationDays || 0) > 0
                ? `${Number(slide.durationDays)} ${tr("يوم", "day")}`
                : null,
              Number(slide.durationHours || 0) > 0
                ? `${Number(slide.durationHours)} ${tr("ساعة", "hour")}`
                : null,
            ]
              .filter(Boolean)
              .join(" + ")
          : null,
        fallback: null,
      },
    ].filter((item) => Boolean(item.value || item.fallback));

  const getRemainingTime = (endAt?: string) => {
    const endTime = endAt ? new Date(endAt).getTime() : null;
    if (!endTime || Number.isNaN(endTime)) return null;

    const remainingMs = endTime - now;
    if (remainingMs <= 0) {
      return tr("انتهى العرض", "Offer ended");
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [
      `${days.toString().padStart(2, "0")} ${tr("يوم", "d")}`,
      `${hours.toString().padStart(2, "0")} ${tr("ساعة", "h")}`,
      `${minutes.toString().padStart(2, "0")} ${tr("دقيقة", "m")}`,
      `${seconds.toString().padStart(2, "0")} ${tr("ثانية", "s")}`,
    ];

    return parts.join(" : ");
  };

  if (embedded && !isLoading && slides.length === 0) {
    return null;
  }

  return (
    <div
      className={
        embedded
          ? "bg-transparent"
          : "min-h-screen bg-white px-2 py-6 sm:px-3 lg:px-4"
      }
    >
      <div className={embedded ? "w-full" : "mx-auto max-w-6xl"}>
      

        {isLoading ? (
          <div className="h-[320px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        ) : slides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500">
            {tr("لا توجد عروض حالياً", "No offers available currently")}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {slides.map((slide, index) => {
              const ctaText = getOfferText(slide, "ctaText");
              const description = getOfferDescription(slide);
              const priceItems = offerPriceItems(slide);
              const remainingTime = getRemainingTime(slide.endAt);
              const offerCard = (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-col gap-2.5 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {tr("عرض", "Offer")} {index + 1}
                      </p>
                      {remainingTime ? (
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          {tr("ينتهي خلال", "Ends in")}: {remainingTime}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className="rounded-2xl px-3 py-3 text-center text-white"
                      style={{
                        background:
                          slide.background ||
                          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
                      }}
                    >
                      <p className="text-lg sm:text-xl font-extrabold tracking-wide">
                        {slide.companyName}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-sm md:text-lg font-bold text-slate-900 line-clamp-2 text-center">
                        {getOfferText(slide, "title")}
                      </h2>
                      {getOfferText(slide, "subtitle") ? (
                        <p className="text-xs sm:text-sm text-slate-700 line-clamp-1 text-center">
                          {getOfferText(slide, "subtitle")}
                        </p>
                      ) : null}
                      {description ? (
                        <p className="text-xs sm:text-sm leading-5 text-slate-600 line-clamp-2 text-center">
                          {description}
                        </p>
                      ) : null}
                      {priceItems.length > 0 ? (
                        <div className="grid gap-1.5 pt-0.5 sm:grid-cols-2">
                          {priceItems.map((item) => (
                            <div
                              key={`${slide._id || slide.companyId}-${item.label}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-xs font-bold text-slate-900">
                                {item.value || item.fallback}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {ctaText ? (
                      /^https?:\/\//i.test(String(slide.ctaLink || "")) ? (
                        <a
                          href={String(slide.ctaLink || "")}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center self-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          {ctaText}
                        </a>
                      ) : (
                        <Link
                          to={String(slide.ctaLink || "/offers")}
                          className="inline-flex w-fit items-center self-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          {ctaText}
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              );

              if (
                slide.ctaLink &&
                !/^https?:\/\//i.test(String(slide.ctaLink))
              ) {
                return (
                  <div key={slide._id || `${slide.companyId}-${index}`}>
                    {offerCard}
                  </div>
                );
              }

              return (
                <div key={slide._id || `${slide.companyId}-${index}`}>
                  {offerCard}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
