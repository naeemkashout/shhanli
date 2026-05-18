import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlobalCountrySelector } from "@/components/GlobalCountrySelector";
import { SearchableStateSelector } from "@/components/SearchableStateSelector";
import {
  GlobalCountry,
  GlobalState,
  getCountryByCode,
  getStateByCode,
} from "@/data/globalLocations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  User,
  MapPin,
  Globe,
  Map,
  Wallet,
  Calculator,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Eye,
  Edit,
  Building,
  UserCheck,
  Upload,
  FileText,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import OperationStatus from "@/components/OperationStatus";
import { useOperationStatus } from "@/hooks/useOperationStatus";
import { useAuth } from "@/contexts/AuthContext";
import shipmentService from "@/services/shipmentService";
import shippingCompanyService from "@/services/shippingCompanyService";
import contactService from "@/services/contactService";
import walletService from "@/services/walletService";

interface Contact {
  id: string;
  type: "sender" | "receiver" | "both";
  name: string;
  phone: string;
  email?: string;
  address: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  clientType: "individual" | "merchant";
  companyName?: string;
  commercialRegister?: string;
  coordinates?: { lat: number; lng: number };
}

interface Receiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  street: string;
  country: string;
  state: string;
  city: string;
  coordinates: { lat: number; lng: number } | null;
}

interface ShippingCompany {
  _id: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  supportedCountries: string[];
  supportedLocalStates?: string[];
  supportsLocal: boolean;
  supportsInternational: boolean;
  pricing: {
    localPerKgSYP: number;
    internationalPerKgUSD: number;
  };
  volumetricDivisor?: number;
  codService?: {
    enabled: boolean;
    localFeeSYP: number;
    internationalFeeUSD: number;
  };
  packagingService?: {
    enabled: boolean;
    localFeeSYP: number;
    internationalFeeUSD: number;
  };
  offers?: Array<{
    _id?: string;
    title?: string;
    localPrice?: number;
    localPriceSYP?: number;
    internationalPrice?: number;
    internationalPriceUSD?: number;
    codFee?: number;
    codFeeSYP?: number;
    codFeeUSD?: number;
    expressFeeSYP?: number;
    expressFeeUSD?: number;
    priority?: number;
    isActive?: boolean;
    startAt?: string;
    endAt?: string;
  }>;
}

interface Country {
  code: string;
  name: string;
  states: { [key: string]: string[] };
}

const NEW_CONTACT_OPTION = "__new_contact__";

const isOfferActive = (offer?: ShippingCompany["offers"][number]) => {
  if (!offer?.title || !offer.isActive) return false;

  const now = Date.now();
  const startAt = offer.startAt ? new Date(offer.startAt).getTime() : null;
  const endAt = offer.endAt ? new Date(offer.endAt).getTime() : null;

  if (startAt && !Number.isNaN(startAt) && startAt > now) return false;
  if (endAt && !Number.isNaN(endAt) && endAt < now) return false;

  return true;
};

const countries: Country[] = [
  {
    code: "SY",
    name: "سوريا",
    states: {
      دمشق: ["دمشق", "جرمانا", "دوما", "قطنا"],
      حلب: ["حلب", "اعزاز", "الباب", "منبج"],
      حمص: ["حمص", "تدمر", "الرستن", "تلبيسة"],
      اللاذقية: ["اللاذقية", "جبلة", "القرداحة", "الحفة"],
    },
  },
  {
    code: "LB",
    name: "لبنان",
    states: {
      بيروت: ["بيروت"],
      جبل_لبنان: ["جونية", "بعبدا", "عاليه", "المتن"],
      الشمال: ["طرابلس", "زغرتا", "الكورة", "البترون"],
      الجنوب: ["صيدا", "صور", "النبطية", "مرجعيون"],
    },
  },
  {
    code: "JO",
    name: "الأردن",
    states: {
      عمان: ["عمان", "الزرقاء", "السلط", "مادبا"],
      إربد: ["إربد", "الرمثا", "عجلون", "جرش"],
      الكرك: ["الكرك", "الطفيلة", "معان", "العقبة"],
    },
  },
];

export default function CreateShipment() {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const operationStatus = useOperationStatus();
  const [isPresetCompanyApplied, setIsPresetCompanyApplied] = useState(false);
  const [presetCompanyId, setPresetCompanyId] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingType, setShippingType] = useState<"local" | "international">(
    "local",
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [currentMapTarget, setCurrentMapTarget] = useState<
    "sender" | "receiver"
  >("sender");
  const [currentReceiverIndex, setCurrentReceiverIndex] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>(
    [],
  );
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<ShippingCompany | null>(
    null,
  );
  const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [userBalance, setUserBalance] = useState({ USD: 0, SYP: 0 });
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [usedContactIds, setUsedContactIds] = useState<string[]>([]);
  const [selectedSenderContactId, setSelectedSenderContactId] =
    useState(NEW_CONTACT_OPTION);
  const [selectedReceiverContactIds, setSelectedReceiverContactIds] = useState<
    Record<string, string>
  >({
    "1": NEW_CONTACT_OPTION,
  });
  const [senderContactSearch, setSenderContactSearch] = useState("");
  const [receiverContactSearch, setReceiverContactSearch] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState({
    // Sender Info
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    senderAddress: "",
    senderStreet: "",
    commercialRegister: "",
    senderCountry: "SY", // Syria country code for local shipping
    senderState: "",
    senderCity: "",
    senderClientType: "individual" as "individual" | "merchant",
    senderCompanyName: "",
    senderCompanyDocuments: [] as File[],
    senderCoordinates: null as { lat: number; lng: number } | null,

    // Package Info
    packageType: "",
    description: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    value: "",
    currency: "SYP" as "USD" | "SYP", // Default to SYP for local shipping
    fragile: false,
    packagingRequested: false,

    // Shipping Info
    shippingCompany: "",
    paymentMethod: "wallet" as "wallet" | "cod", // Only wallet and COD
    notes: "",
  });

  // Multiple receivers state (removed clientType)
  const [receivers, setReceivers] = useState<Receiver[]>([
    {
      id: "1",
      name: "",
      phone: "",
      email: "",
      address: "",
      street: "",
      country: "SY", // Syria country code for local shipping
      state: "",
      city: "",
      coordinates: null,
    },
  ]);

  // Auto-set country and currency based on shipping type
  useEffect(() => {
    if (shippingType === "local") {
      setFormData((prev) => ({
        ...prev,
        senderCountry: "SY", // Syria country code
        currency: "SYP", // Local shipping uses SYP
      }));
      setReceivers((prev) =>
        prev.map((receiver) => ({ ...receiver, country: "SY" })),
      );
    } else {
      // International shipping uses USD
      setFormData((prev) => ({
        ...prev,
        currency: "USD",
      }));
    }
  }, [shippingType]);

  useEffect(() => {
    const loadShippingCompanies = async () => {
      try {
        const companies = await shippingCompanyService.getShippingCompanies();
        setShippingCompanies(companies);
      } catch (error: any) {
        toast.error(
          error.message ||
            (isRTL
              ? "فشل تحميل شركات الشحن"
              : "Failed to load shipping companies"),
        );
      }
    };

    loadShippingCompanies();
  }, []);

  useEffect(() => {
    if (isPresetCompanyApplied || !shippingCompanies.length) {
      return;
    }

    const companyId = searchParams.get("companyId");
    const shippingTypeParam = searchParams.get("shippingType");
    const offerOnly = searchParams.get("offerOnly") === "1";
    const offerId = String(searchParams.get("offerId") || "").trim();

    if (!companyId) {
      setIsPresetCompanyApplied(true);
      setPresetCompanyId("");
      return;
    }

    const company = shippingCompanies.find((item) => item._id === companyId);

    if (!company) {
      toast.error(
        isRTL
          ? "الشركة المحددة غير موجودة أو غير متاحة حاليا"
          : "The selected shipping company is unavailable or does not exist",
      );
      setIsPresetCompanyApplied(true);
      return;
    }

    let nextShippingType: "local" | "international" = shippingType;

    if (
      shippingTypeParam === "local" ||
      shippingTypeParam === "international"
    ) {
      nextShippingType = shippingTypeParam;
    } else if (company.supportsLocal && !company.supportsInternational) {
      nextShippingType = "local";
    } else if (!company.supportsLocal && company.supportsInternational) {
      nextShippingType = "international";
    }

    if (
      nextShippingType === "local" &&
      !company.supportsLocal &&
      company.supportsInternational
    ) {
      nextShippingType = "international";
    }

    if (
      nextShippingType === "international" &&
      !company.supportsInternational &&
      company.supportsLocal
    ) {
      nextShippingType = "local";
    }

    setShippingType(nextShippingType);
    setPresetCompanyId(company._id);
    setSelectedOfferId(offerOnly ? offerId : "");
    setFormData((prev) => ({
      ...prev,
      shippingCompany: company._id,
      paymentMethod:
        prev.paymentMethod === "cod" && !company.codService?.enabled
          ? "wallet"
          : prev.paymentMethod,
    }));

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("companyId");
    nextParams.delete("shippingType");
    nextParams.delete("offerOnly");
    nextParams.delete("offerId");
    setSearchParams(nextParams, { replace: true });

    toast.success(
      isRTL
        ? `تم اختيار شركة الشحن ${company.name} مسبقا`
        : `Shipping company ${company.name} was preselected`,
    );
    setIsPresetCompanyApplied(true);
  }, [
    isPresetCompanyApplied,
    searchParams,
    setSearchParams,
    shippingCompanies,
    shippingType,
  ]);

  const loadContacts = async () => {
    try {
      const response = await contactService.getUserContacts({ limit: 200 });
      const mappedContacts: Contact[] = (response?.data || []).map(
        (contact: any) => ({
          id: contact._id || contact.id,
          type: contact.type || "both",
          name: contact.name,
          phone: contact.phone,
          email: contact.email || "",
          address: contact.address || contact.street || "",
          street: contact.street || contact.address || "",
          city: contact.city,
          state: contact.state,
          country: contact.country,
          clientType: contact.clientType || "individual",
          companyName: contact.companyName || "",
          commercialRegister: contact.commercialRegister || "",
          coordinates: contact.coordinates || null,
        }),
      );
      setContacts(mappedContacts);
    } catch (error: any) {
      toast.error(
        error.message ||
          (isRTL ? "فشل تحميل العملاء" : "Failed to load contacts"),
      );
    }
  };

  const getActiveOffers = (company?: ShippingCompany | null) => {
    if (!company?.offers?.length) return [];

    return company.offers
      .filter((offer) => isOfferActive(offer))
      .sort(
        (left, right) =>
          Number(right?.priority || 0) - Number(left?.priority || 0),
      );
  };

  const getSelectedOffer = (company?: ShippingCompany | null) => {
    const activeOffers = getActiveOffers(company);
    if (!activeOffers.length) return null;

    if (selectedOfferId) {
      return (
        activeOffers.find(
          (offer) => String(offer._id || "") === selectedOfferId,
        ) || activeOffers[0]
      );
    }

    return activeOffers[0];
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const loadWalletBalance = async () => {
      try {
        const response = await walletService.getBalance();
        const balance = response?.balance || {};

        setUserBalance({
          USD: Number(balance.USD) || 0,
          SYP: Number(balance.SYP) || 0,
        });
      } catch (error: any) {
        toast.error(
          error.message ||
            (isRTL
              ? "فشل تحميل رصيد المحفظة"
              : "Failed to load wallet balance"),
        );
      } finally {
        setIsBalanceLoading(false);
      }
    };

    loadWalletBalance();
  }, []);

  useEffect(() => {
    const selectedCompany = shippingCompanies.find(
      (c) => c._id === formData.shippingCompany,
    );

    if (
      formData.paymentMethod === "cod" &&
      selectedCompany &&
      !selectedCompany.codService?.enabled
    ) {
      setFormData((prev) => ({ ...prev, paymentMethod: "wallet" }));
    }

    if (
      formData.packagingRequested &&
      selectedCompany &&
      !selectedCompany.packagingService?.enabled
    ) {
      setFormData((prev) => ({ ...prev, packagingRequested: false }));
    }
  }, [
    formData.shippingCompany,
    formData.paymentMethod,
    formData.packagingRequested,
    shippingCompanies,
  ]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Calculate estimated cost
  useEffect(() => {
    if (formData.weight && formData.shippingCompany && receivers.length > 0) {
      const company = shippingCompanies.find(
        (c) => c._id === formData.shippingCompany,
      );
      if (company) {
        const selectedOffer = getSelectedOffer(company);
        const actualWeight = parseFloat(formData.weight);
        const volumetricDivisor =
          Number(company.volumetricDivisor) > 0
            ? Number(company.volumetricDivisor)
            : 6000;

        // حساب الوزن الحجمي: (الطول × العرض × الارتفاع) ÷ معامل الشركة
        const volumetricWeight =
          formData.length && formData.width && formData.height
            ? (parseFloat(formData.length) *
                parseFloat(formData.width) *
                parseFloat(formData.height)) /
              volumetricDivisor
            : 0;

        // استخدام الوزن الأكبر (الوزن العادي أو الوزن الحجمي)
        const billingWeight = Math.max(actualWeight, volumetricWeight);

        const totalCost = selectedOffer
          ? shippingType === "local"
            ? Number(
                selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0,
              )
            : Number(
                selectedOffer.internationalPriceUSD ??
                  selectedOffer.internationalPrice ??
                  0,
              )
          : billingWeight *
            (shippingType === "local"
              ? company.pricing?.localPerKgSYP || 0
              : company.pricing?.internationalPerKgUSD || 0);

        setEstimatedCost(totalCost);
      }
    }
  }, [
    formData.weight,
    formData.length,
    formData.width,
    formData.height,
    formData.shippingCompany,
    shippingType,
    shippingCompanies,
    receivers,
    selectedOfferId,
  ]);

  // Update used contact IDs when receivers change
  useEffect(() => {
    const receiverContactIds = receivers
      .map(
        (receiver) =>
          contacts.find(
            (c) => c.name === receiver.name && c.phone === receiver.phone,
          )?.id,
      )
      .filter(Boolean) as string[];

    const senderContactId = contacts.find(
      (c) => c.name === formData.senderName && c.phone === formData.senderPhone,
    )?.id;

    const allUsedIds = [...receiverContactIds];
    if (senderContactId) {
      allUsedIds.push(senderContactId);
    }

    setUsedContactIds(allUsedIds);
  }, [receivers, formData.senderName, formData.senderPhone, contacts]);

  const getAvailableCompanies = () => {
    if (receivers.length === 0) return [];

    if (presetCompanyId) {
      return shippingCompanies.filter(
        (company) => company._id === presetCompanyId,
      );
    }

    const normalizeValue = (value: string) => value.trim().toLowerCase();

    const companySupportsLocalState = (
      company: ShippingCompany,
      stateCode: string,
    ) => {
      if (!company.supportedLocalStates?.length) {
        return true;
      }

      const state = getStateByCode("SY", stateCode);
      const acceptedValues = new Set(
        [stateCode, state?.name.ar, state?.name.en]
          .filter(Boolean)
          .map((value) => normalizeValue(value as string)),
      );

      return company.supportedLocalStates.some((supportedState) =>
        acceptedValues.has(normalizeValue(supportedState)),
      );
    };

    if (shippingType === "local") {
      const receiverStates = [
        ...new Set(receivers.map((receiver) => receiver.state).filter(Boolean)),
      ];

      return shippingCompanies.filter(
        (company) =>
          company.supportsLocal &&
          receiverStates.every((stateCode) =>
            companySupportsLocalState(company, stateCode),
          ),
      );
    }

    // Get companies that support all receiver countries
    const receiverCountries = [
      ...new Set(receivers.map((r) => r.country).filter(Boolean)),
    ];

    const normalizeCountryValue = (value: string) => value.trim().toLowerCase();

    const companySupportsCountry = (
      company: ShippingCompany,
      countryCode: string,
    ) => {
      if (!company.supportedCountries?.length) {
        return true;
      }

      const country = getCountryByCode(countryCode);
      const acceptedValues = new Set(
        [countryCode, country?.name.ar, country?.name.en]
          .filter(Boolean)
          .map((value) => normalizeCountryValue(value as string)),
      );

      return company.supportedCountries.some((supportedCountry) =>
        acceptedValues.has(normalizeCountryValue(supportedCountry)),
      );
    };

    return shippingCompanies.filter(
      (company) =>
        company.supportsInternational &&
        receiverCountries.every((country) =>
          companySupportsCountry(company, country),
        ),
    );
  };

  const getStatesForCountry = (countryName: string) => {
    const country = countries.find((c) => c.name === countryName);
    return country ? Object.keys(country.states) : [];
  };

  const getCitiesForState = (countryName: string, stateName: string) => {
    const country = countries.find((c) => c.name === countryName);
    return country && country.states[stateName]
      ? country.states[stateName]
      : [];
  };

  const getAvailableContacts = (
    forReceiver: boolean = false,
    currentSelectedId?: string,
  ) => {
    return contacts.filter((contact) => {
      const isTypeAllowed = forReceiver
        ? contact.type === "receiver" || contact.type === "both"
        : contact.type === "sender" || contact.type === "both";

      const isCurrentlySelected =
        !!currentSelectedId && contact.id === currentSelectedId;

      return (
        isTypeAllowed &&
        (!usedContactIds.includes(contact.id) || isCurrentlySelected)
      );
    });
  };

  const filterContactsBySearch = (items: Contact[], searchValue: string) => {
    const query = String(searchValue || "")
      .trim()
      .toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((contact) =>
      [
        contact.name,
        contact.phone,
        contact.city,
        contact.email,
        contact.companyName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  };

  const isSyrianCountryValue = (value?: string) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return ["sy", "سوريا", "سورية", "syria", "syrian arab republic"].includes(
      normalized,
    );
  };

  const normalizeCountryCode = (value?: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "";
    if (isSyrianCountryValue(normalized)) return "SY";
    if (/^[a-z]{2}$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };

  const handleContactSelect = (
    contactId: string,
    type: "sender" | "receiver",
    receiverIndex?: number,
  ) => {
    if (contactId === NEW_CONTACT_OPTION) {
      if (type === "sender") {
        setSelectedSenderContactId(NEW_CONTACT_OPTION);
        setSenderContactSearch("");
        setFormData((prev) => ({
          ...prev,
          senderName: "",
          senderPhone: "",
          senderEmail: "",
          senderAddress: "",
          senderStreet: "",
          senderCountry: shippingType === "local" ? "SY" : "",
          senderState: "",
          senderCity: "",
          senderClientType: "individual",
          senderCompanyName: "",
          commercialRegister: "",
          senderCoordinates: null,
        }));
      } else if (type === "receiver" && receiverIndex !== undefined) {
        setReceivers((prev) =>
          prev.map((receiver, index) =>
            index === receiverIndex
              ? {
                  ...receiver,
                  name: "",
                  phone: "",
                  email: "",
                  address: "",
                  street: "",
                  country: shippingType === "local" ? "SY" : "",
                  state: "",
                  city: "",
                  coordinates: null,
                }
              : receiver,
          ),
        );

        const receiverId = receivers[receiverIndex]?.id;
        if (receiverId) {
          setReceiverContactSearch((prev) => ({
            ...prev,
            [receiverId]: "",
          }));
          setSelectedReceiverContactIds((prev) => ({
            ...prev,
            [receiverId]: NEW_CONTACT_OPTION,
          }));
        }
      }

      return;
    }

    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      const isLocalAndNonSyrian =
        shippingType === "local" && !isSyrianCountryValue(contact.country);
      const normalizedContactCountry = normalizeCountryCode(contact.country);

      if (type === "sender") {
        setSelectedSenderContactId(contact.id);
        setSenderContactSearch("");
        setFormData((prev) => ({
          ...prev,
          senderName: contact.name,
          senderPhone: contact.phone,
          senderEmail: contact.email || "",
          senderAddress: contact.address,
          senderStreet: contact.street || "",
          senderCountry: isLocalAndNonSyrian
            ? "SY"
            : normalizedContactCountry || contact.country,
          senderState: isLocalAndNonSyrian ? "" : contact.state,
          senderCity: isLocalAndNonSyrian ? "" : contact.city,
          senderClientType: contact.clientType,
          senderCompanyName: contact.companyName || "",
          commercialRegister: contact.commercialRegister || "",
          senderCoordinates: contact.coordinates || null,
        }));
      } else if (type === "receiver" && receiverIndex !== undefined) {
        const receiverId = receivers[receiverIndex]?.id;
        if (receiverId) {
          setSelectedReceiverContactIds((prev) => ({
            ...prev,
            [receiverId]: contact.id,
          }));
        }

        setReceivers((prev) =>
          prev.map((receiver, index) =>
            index === receiverIndex
              ? {
                  ...receiver,
                  name: contact.name,
                  phone: contact.phone,
                  email: contact.email || "",
                  address: contact.address,
                  street: contact.street || "",
                  country: isLocalAndNonSyrian
                    ? "SY"
                    : normalizedContactCountry || contact.country,
                  state: isLocalAndNonSyrian ? "" : contact.state,
                  city: isLocalAndNonSyrian ? "" : contact.city,
                  coordinates: contact.coordinates || null,
                }
              : receiver,
          ),
        );
      }

      if (isLocalAndNonSyrian) {
        toast.warning(
          isRTL
            ? "تم اختيار عميل بدولة غير سورية. لأن الشحن محلي تم ضبط الدولة تلقائيا إلى سوريا، يرجى تحديد المحافظة والمدينة من جديد."
            : "A client from a non-Syrian country was selected. Since shipping is local, country was automatically set to Syria. Please reselect state and city.",
        );
      }
    }
  };

  const addReceiver = () => {
    const newReceiver: Receiver = {
      id: Date.now().toString(),
      name: "",
      phone: "",
      email: "",
      address: "",
      street: "",
      country: shippingType === "local" ? "SY" : "",
      state: "",
      city: "",
      coordinates: null,
    };
    setReceivers((prev) => [...prev, newReceiver]);
    setSelectedReceiverContactIds((prev) => ({
      ...prev,
      [newReceiver.id]: NEW_CONTACT_OPTION,
    }));
  };

  const removeReceiver = (index: number) => {
    if (receivers.length > 1) {
      const removedReceiverId = receivers[index]?.id;
      setReceivers((prev) => prev.filter((_, i) => i !== index));
      if (removedReceiverId) {
        setSelectedReceiverContactIds((prev) => {
          const next = { ...prev };
          delete next[removedReceiverId];
          return next;
        });
      }
    }
  };

  const normalizeContactValue = (value?: string) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const saveContactIfNew = async (
    payload: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      street?: string;
      country: string;
      state: string;
      city: string;
      clientType: "individual" | "merchant";
      companyName?: string;
      commercialRegister?: string;
      coordinates?: { lat: number; lng: number } | null;
    },
    contactType: "sender" | "receiver",
  ) => {
    const existingContact = contacts.find((contact) => {
      const sameIdentity =
        normalizeContactValue(contact.name) ===
          normalizeContactValue(payload.name) &&
        normalizeContactValue(contact.phone) ===
          normalizeContactValue(payload.phone);

      if (!sameIdentity) return false;

      return contact.type === "both" || contact.type === contactType;
    });

    if (existingContact) {
      return;
    }

    const withSameIdentity = contacts.find(
      (contact) =>
        normalizeContactValue(contact.name) ===
          normalizeContactValue(payload.name) &&
        normalizeContactValue(contact.phone) ===
          normalizeContactValue(payload.phone),
    );

    if (withSameIdentity) {
      if (withSameIdentity.type !== "both") {
        await contactService.updateContact(withSameIdentity.id, {
          type: "both",
        });
      }
      return;
    }

    await contactService.createContact({
      name: payload.name,
      phone: payload.phone,
      email: payload.email || "",
      address: (payload.address || payload.street || "").trim(),
      street: (payload.street || payload.address || "").trim(),
      country: payload.country,
      state: payload.state,
      city: payload.city,
      clientType: payload.clientType,
      companyName: payload.companyName || "",
      commercialRegister: payload.commercialRegister || "",
      type: contactType,
      coordinates: payload.coordinates || undefined,
    });
  };

  const updateReceiver = (
    index: number,
    field: string,
    value: string | { lat: number; lng: number } | null,
  ) => {
    setReceivers((prev) =>
      prev.map((receiver, i) =>
        i === index ? { ...receiver, [field]: value } : receiver,
      ),
    );
  };

  const openMapForLocation = (
    target: "sender" | "receiver",
    receiverIndex?: number,
  ) => {
    setCurrentMapTarget(target);
    if (receiverIndex !== undefined) {
      setCurrentReceiverIndex(receiverIndex);
    }
    setIsMapOpen(true);
  };

  const handleMapLocationSelect = (coordinates: {
    lat: number;
    lng: number;
  }) => {
    if (currentMapTarget === "sender") {
      setFormData((prev) => ({ ...prev, senderCoordinates: coordinates }));
    } else {
      setReceivers((prev) =>
        prev.map((receiver, index) =>
          index === currentReceiverIndex
            ? { ...receiver, coordinates }
            : receiver,
        ),
      );
    }
    setIsMapOpen(false);
    toast.success(t("msg.locationSelected"));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        senderCompanyDocuments: [...prev.senderCompanyDocuments, ...fileArray],
      }));
      toast.success(t("msg.filesUploaded", { count: fileArray.length }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      senderCompanyDocuments: prev.senderCompanyDocuments.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const toLatinDigits = (value: string) => {
    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
    const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";

    return String(value || "")
      .split("")
      .map((char) => {
        const idxArabicIndic = arabicIndic.indexOf(char);
        if (idxArabicIndic >= 0) return String(idxArabicIndic);

        const idxEasternArabicIndic = easternArabicIndic.indexOf(char);
        if (idxEasternArabicIndic >= 0) return String(idxEasternArabicIndic);

        return char;
      })
      .join("");
  };

  const normalizePhone = (value?: string) => {
    const latin = toLatinDigits(String(value || "").trim());
    const compact = latin.replace(/[\s()\-]/g, "");
    return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  };

  const isValidPhone = (value?: string) => {
    const phone = normalizePhone(value);
    return /^\+?[0-9]{8,15}$/.test(phone);
  };

  const isValidEmail = (value?: string) => {
    const email = String(value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 2:
        // التحقق من جميع الحقول المطلوبة للمرسل
        if (!formData.senderName?.trim()) {
          toast.error(t("validation.firstNameRequired"));
          return false;
        }
        if (!formData.senderPhone?.trim()) {
          toast.error(t("validation.phoneRequired"));
          return false;
        }
        if (!formData.senderEmail?.trim()) {
          toast.error(t("validation.emailRequired"));
          return false;
        }
        if (!isValidPhone(formData.senderPhone)) {
          toast.error(
            isRTL
              ? "يرجى إدخال رقم موبايل صحيح (8 إلى 15 رقم)"
              : "Please enter a valid mobile number (8 to 15 digits)",
          );
          return false;
        }
        if (!isValidEmail(formData.senderEmail)) {
          toast.error(
            isRTL
              ? "يرجى إدخال بريد إلكتروني صحيح"
              : "Please enter a valid email address",
          );
          return false;
        }
        if (!formData.senderCountry) {
          toast.error(t("validation.countryRequired"));
          return false;
        }
        if (
          shippingType === "local" &&
          !isSyrianCountryValue(formData.senderCountry)
        ) {
          toast.error(
            isRTL
              ? "في الشحن المحلي يجب أن تكون دولة المرسل سوريا"
              : "For local shipping, the sender country must be Syria",
          );
          return false;
        }
        if (!formData.senderState) {
          toast.error(t("validation.provinceRequired"));
          return false;
        }
        if (!formData.senderCity?.trim()) {
          toast.error(t("validation.cityRequired"));
          return false;
        }
        if (!formData.senderStreet?.trim()) {
          toast.error(t("validation.streetRequired"));
          return false;
        }
        if (!formData.senderClientType) {
          toast.error(t("validation.clientTypeRequired"));
          return false;
        }

        // التحقق من الحقول الخاصة بالتجار
        if (formData.senderClientType === "merchant") {
          if (!formData.senderCompanyName?.trim()) {
            toast.error(t("validation.companyNameRequired"));
            return false;
          }
          if (!formData.commercialRegister?.trim()) {
            toast.error(t("validation.commercialRegisterRequired"));
            return false;
          }
        }

        return true;
      case 3:
        for (let i = 0; i < receivers.length; i++) {
          const receiver = receivers[i];
          if (
            !receiver.name ||
            !receiver.phone ||
            !receiver.email ||
            !receiver.country ||
            !receiver.state ||
            !receiver.city ||
            !receiver.street
          ) {
            toast.error(t("msg.fillReceiverRequired", { number: i + 1 }));
            return false;
          }
          if (!receiver.country || !receiver.state || !receiver.city) {
            toast.error(t("msg.selectReceiverLocation", { number: i + 1 }));
            return false;
          }
          if (!isValidPhone(receiver.phone)) {
            toast.error(
              isRTL
                ? `رقم موبايل المستلم ${i + 1} غير صحيح`
                : `Receiver ${i + 1} mobile number is invalid`,
            );
            return false;
          }
          if (!isValidEmail(receiver.email)) {
            toast.error(
              isRTL
                ? `البريد الإلكتروني للمستلم ${i + 1} غير صحيح`
                : `Receiver ${i + 1} email is invalid`,
            );
            return false;
          }
          if (
            shippingType === "local" &&
            !isSyrianCountryValue(receiver.country)
          ) {
            toast.error(
              `في الشحن المحلي يجب أن تكون دولة المستلم ${i + 1} سوريا`,
            );
            return false;
          }
        }
        return true;
      case 4: {
        if (!formData.packageType || !formData.description) {
          toast.error(t("msg.fillPackageDetails"));
          return false;
        }
        const weight = parseFloat(formData.weight);
        const length = parseFloat(formData.length);
        const width = parseFloat(formData.width);
        const height = parseFloat(formData.height);
        const value = parseFloat(formData.value);

        if (!weight || weight < 1) {
          toast.error(t("msg.invalidWeight"));
          return false;
        }
        if (!length || length < 1) {
          toast.error(t("msg.invalidLength"));
          return false;
        }
        if (!width || width < 1) {
          toast.error(t("msg.invalidWidth"));
          return false;
        }
        if (!height || height < 1) {
          toast.error(t("msg.invalidHeight"));
          return false;
        }
        if (!value || value < 1) {
          toast.error(t("msg.invalidValue"));
          return false;
        }
        return true;
      }
      case 5:
        if (!formData.shippingCompany) {
          toast.error(t("msg.selectCompany"));
          return false;
        }
        if (
          !getAvailableCompanies().some(
            (company) => company._id === formData.shippingCompany,
          )
        ) {
          toast.error(
            isRTL
              ? "شركة الشحن المحددة لا تدعم وجهات المستلمين الحالية"
              : "The selected shipping company does not support current receiver destinations",
          );
          return false;
        }
        if (!formData.paymentMethod) {
          toast.error(t("msg.selectPaymentMethod"));
          return false;
        }
        if (
          formData.paymentMethod === "cod" &&
          !getSelectedCompany()?.codService?.enabled
        ) {
          toast.error(
            isRTL
              ? "خدمة الدفع عند الاستلام غير متاحة مع شركة الشحن المحددة"
              : "Cash on delivery is not available for the selected shipping company",
          );
          return false;
        }
        if (
          formData.packagingRequested &&
          !getSelectedCompany()?.packagingService?.enabled
        ) {
          toast.error(
            isRTL
              ? "خدمة التغليف غير متاحة مع شركة الشحن المحددة"
              : "Packaging service is not available for the selected shipping company",
          );
          return false;
        }
        if (formData.paymentMethod === "wallet") {
          if (isBalanceLoading) {
            toast.error(
              isRTL
                ? "يرجى الانتظار حتى تحميل رصيد المحفظة"
                : "Please wait until wallet balance is loaded",
            );
            return false;
          }

          const currency = formData.currency === "USD" ? "USD" : "SYP";
          const balance = userBalance[currency];
          if (totalCostWithFees > balance) {
            toast.error(
              t("msg.insufficientBalance", {
                balance: balance.toLocaleString(),
                currency,
              }),
            );
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handleSubmit = async () => {
    await operationStatus.executeOperation(async () => {
      const selectedVolumetricDivisor = getSelectedVolumetricDivisor();

      const shipmentData = {
        shippingType,
        sender: {
          name: formData.senderName,
          phone: formData.senderPhone,
          email: formData.senderEmail,
          address: formData.senderAddress,
          street: formData.senderStreet,
          country: formData.senderCountry,
          state: formData.senderState,
          city: formData.senderCity,
          clientType: formData.senderClientType,
          companyName: formData.senderCompanyName,
          commercialRegister: formData.commercialRegister,
          coordinates: formData.senderCoordinates,
        },
        receivers: receivers.map((receiver) => ({
          name: receiver.name,
          phone: receiver.phone,
          email: receiver.email,
          address: receiver.address,
          street: receiver.street,
          country: receiver.country,
          state: receiver.state,
          city: receiver.city,
          coordinates: receiver.coordinates,
        })),
        package: {
          type: formData.packageType,
          weight: parseFloat(formData.weight),
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          description: formData.description,
          value: parseFloat(formData.value),
          currency: formData.currency,
          fragile: formData.fragile,
          packagingRequested: formData.packagingRequested,
        },
        shippingCompany: {
          id: formData.shippingCompany,
          name: getSelectedCompany()?.name || "",
        },
        offerOnly: Boolean(getSelectedOffer(getSelectedCompany())),
        offerId: getSelectedOffer(getSelectedCompany())?._id || undefined,
        cost: {
          amount: totalCostWithFees,
          baseAmount: estimatedCost,
          codFee: getCodFee(),
          packagingFee: getPackagingFee(),
          currency: formData.currency,
          paymentMethod: formData.paymentMethod,
          volumetricWeight:
            (parseFloat(formData.length) *
              parseFloat(formData.width) *
              parseFloat(formData.height)) /
            selectedVolumetricDivisor,
          actualWeight: parseFloat(formData.weight),
          billingWeight: Math.max(
            parseFloat(formData.weight),
            (parseFloat(formData.length) *
              parseFloat(formData.width) *
              parseFloat(formData.height)) /
              selectedVolumetricDivisor,
          ),
          volumetricDivisor: selectedVolumetricDivisor,
        },
        notes: formData.notes,
      };

      await shipmentService.createShipment(shipmentData);
      await loadContacts();
      await refreshUser();

      return true;
    });
  };

  const handleOperationSuccess = () => {
    operationStatus.reset();
    navigate("/shipments");
    toast.success(
      t("msg.shipmentCreatedMultiple", { count: receivers.length }),
    );
  };

  const handleOperationRetry = () => {
    handleSubmit();
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    } else {
      return (
        new Intl.NumberFormat(isRTL ? "ar-SY" : "en-US").format(amount) +
        " " +
        t("currency.syp")
      );
    }
  };

  const formatWalletBalanceNumber = (
    amount: number,
    currency: "USD" | "SYP",
  ) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }).format(Number(amount || 0));
  };

  const getSelectedCompany = () => {
    return shippingCompanies.find((c) => c._id === formData.shippingCompany);
  };

  const getSelectedVolumetricDivisor = () => {
    const divisor = Number(getSelectedCompany()?.volumetricDivisor);
    return Number.isFinite(divisor) && divisor > 0 ? divisor : 6000;
  };

  const getCompanyCoverageLabel = (company: ShippingCompany) => {
    if (company.supportsLocal && company.supportsInternational) {
      return "محلي ودولي";
    }

    return company.supportsLocal ? "محلي فقط" : "دولي فقط";
  };

  const getCompanyPriceLabel = (company: ShippingCompany) => {
    const selectedOffer =
      company._id === formData.shippingCompany
        ? getSelectedOffer(company)
        : null;

    if (selectedOffer) {
      const amount =
        shippingType === "local"
          ? Number(selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0)
          : Number(
              selectedOffer.internationalPriceUSD ??
                selectedOffer.internationalPrice ??
                0,
            );

      return formatAmount(amount, formData.currency);
    }

    const amount =
      shippingType === "local"
        ? company.pricing?.localPerKgSYP || 0
        : company.pricing?.internationalPerKgUSD || 0;

    return formatAmount(amount, formData.currency);
  };

  const getCompanySupportedCountriesLabel = (company: ShippingCompany) => {
    if (shippingType === "local") {
      return "داخل سوريا";
    }

    if (!company.supportedCountries?.length) {
      return "جميع الدول المدعومة";
    }

    if (company.supportedCountries.length <= 3) {
      return company.supportedCountries.join(" - ");
    }

    return `${company.supportedCountries.slice(0, 3).join(" - ")} +${company.supportedCountries.length - 3}`;
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openCompanyInfoDialog = (company: ShippingCompany) => {
    setPreviewCompany(company);
    setIsCompanyInfoOpen(true);
  };

  const startCompanyLongPress = (company: ShippingCompany) => {
    clearLongPressTimer();
    setIsLongPressTriggered(false);

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressTriggered(true);
      openCompanyInfoDialog(company);
    }, 650);
  };

  const endCompanyLongPress = () => {
    clearLongPressTimer();
  };

  const handleCompanyCardClick = (company: ShippingCompany) => {
    if (isLongPressTriggered) {
      setIsLongPressTriggered(false);
      return;
    }

    if (company._id !== formData.shippingCompany) {
      setSelectedOfferId("");
    }

    setFormData((prev) => ({
      ...prev,
      shippingCompany: company._id,
    }));
  };

  const getCodFee = () => {
    const company = getSelectedCompany();
    const selectedOffer = getSelectedOffer(company);

    if (formData.paymentMethod !== "cod") {
      return 0;
    }

    if (selectedOffer) {
      return shippingType === "local"
        ? Number(selectedOffer.codFeeSYP ?? selectedOffer.codFee ?? 0)
        : Number(selectedOffer.codFeeUSD || 0);
    }

    if (!company?.codService?.enabled) {
      return 0;
    }

    return shippingType === "local"
      ? company.codService.localFeeSYP || 0
      : company.codService.internationalFeeUSD || 0;
  };

  const getPackagingFee = () => {
    if (!formData.packagingRequested) {
      return 0;
    }

    const company = getSelectedCompany();
    if (!company?.packagingService?.enabled) {
      return 0;
    }

    return shippingType === "local"
      ? Number(company.packagingService.localFeeSYP || 0)
      : Number(company.packagingService.internationalFeeUSD || 0);
  };

  const totalCostWithFees = estimatedCost + getCodFee() + getPackagingFee();

  const getPackageTypeLabel = (type: string) => {
    const typeKey = `package.${type}`;
    return t(typeKey);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodKey = `shipment.${method}`;
    return t(methodKey);
  };

  const getClientTypeLabel = (type: "individual" | "merchant") => {
    return type === "individual"
      ? t("client.individual")
      : t("client.merchant");
  };

  const getClientTypeIcon = (type: "individual" | "merchant") => {
    return type === "individual" ? User : Building;
  };

  const selectedCompany = getSelectedCompany();
  const allowedShippingTypes = selectedCompany
    ? ([
        selectedCompany.supportsLocal ? ("local" as const) : null,
        selectedCompany.supportsInternational
          ? ("international" as const)
          : null,
      ].filter(Boolean) as Array<"local" | "international">)
    : ["local", "international"];

  const steps = [
    { number: 1, title: t("shipment.step1.title") },
    { number: 2, title: t("sender.title") },
    { number: 3, title: t("receiver.titlePlural") },
    { number: 4, title: t("package.title") },
    { number: 5, title: t("shipment.step5.title") },
    { number: 6, title: t("shipment.reviewTitle") },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("shipment.title")}
          </h1>

          <div className="flex items-center justify-center gap-2 mt-8 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium ${
                    step.number === currentStep
                      ? "border-blue-600 bg-blue-600 text-white"
                      : step.number < currentStep
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-white text-gray-500"
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      step.number < currentStep ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("shipment.selectShippingType")}
                  </h3>
                  <p className="text-gray-600">
                    {t("shipment.selectShippingTypeDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto md:grid-cols-2">
                  {allowedShippingTypes.map((type) => {
                    const isSelected = shippingType === type;
                    const isLocal = type === "local";

                    return (
                      <div
                        key={type}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setShippingType(type)}
                      >
                        <div className="text-center">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                              isLocal ? "bg-blue-100" : "bg-green-100"
                            }`}
                          >
                            {isLocal ? (
                              <MapPin className="w-8 h-8 text-blue-600" />
                            ) : (
                              <Globe className="w-8 h-8 text-green-600" />
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {isLocal
                              ? t("shipment.local")
                              : t("shipment.international")}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {isLocal
                              ? t("shipment.localDesc")
                              : t("shipment.internationalDesc")}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {
                              shippingCompanies.filter((company) =>
                                isLocal
                                  ? company.supportsLocal
                                  : company.supportsInternational,
                              ).length
                            }{" "}
                            {t("shipment.companiesAvailable")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {isLocal
                              ? isBalanceLoading
                                ? "جاري تحميل الرصيد..."
                                : `${formatAmount(userBalance.USD, "USD")} | ${formatAmount(userBalance.SYP, "SYP")}`
                              : isRTL
                                ? "الدفع بالدولار الأمريكي"
                                : "Payment in US Dollar"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedCompany && allowedShippingTypes.length === 1 ? (
                  <div className="max-w-2xl mx-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {selectedCompany.name}
                    </p>
                    <p className="mt-1">
                      {allowedShippingTypes[0] === "local"
                        ? t("shipment.local")
                        : t("shipment.international")}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <Label>{t("sender.selectFromContacts")}</Label>
                  {shippingType === "local" && (
                    <p className="text-xs text-amber-700 mt-1">
                      {isRTL
                        ? "ملاحظة: عند اختيار عميل بدولة غير سورية سيتم ضبط الدولة تلقائيا إلى سوريا للشحن المحلي."
                        : "Note: When selecting a client from a country other than Syria, the country will be automatically set to Syria for local shipping."}
                    </p>
                  )}
                  <Select
                    value={selectedSenderContactId}
                    onValueChange={(value) =>
                      handleContactSelect(value, "sender")
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t("sender.selectOrEnterNew")} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input
                          value={senderContactSearch}
                          onChange={(e) =>
                            setSenderContactSearch(e.target.value)
                          }
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder={
                            isRTL ? "ابحث عن عميل..." : "Search contact..."
                          }
                          className="h-9"
                        />
                      </div>
                      <SelectItem value={NEW_CONTACT_OPTION}>
                        {isRTL ? "مرسل جديد" : "New Sender"}
                      </SelectItem>
                      {filterContactsBySearch(
                        getAvailableContacts(false, selectedSenderContactId),
                        senderContactSearch,
                      ).map((contact) => {
                        const ClientIcon = getClientTypeIcon(
                          contact.clientType,
                        );

                        return (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex items-center gap-2">
                              <ClientIcon className="w-4 h-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {contact.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {contact.phone} - {contact.city} (
                                  {getClientTypeLabel(contact.clientType)})
                                  {contact.companyName &&
                                    ` - ${contact.companyName}`}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="senderName">
                      {t("sender.name")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="senderName"
                      value={formData.senderName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderName: e.target.value,
                        }))
                      }
                      placeholder={t("sender.enterName")}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senderPhone">
                      {t("sender.phone")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="senderPhone"
                      type="tel"
                      value={formData.senderPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderPhone: e.target.value,
                        }))
                      }
                      placeholder="+963991234567"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senderEmail">
                      {t("sender.email")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      value={formData.senderEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderEmail: e.target.value,
                        }))
                      }
                      placeholder="example@email.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senderClientType">
                      {t("client.type")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Select
                      value={formData.senderClientType}
                      onValueChange={(value: "individual" | "merchant") =>
                        setFormData((prev) => ({
                          ...prev,
                          senderClientType: value,
                          senderCompanyName:
                            value === "individual"
                              ? ""
                              : prev.senderCompanyName,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {t("client.individual")}
                          </div>
                        </SelectItem>
                        <SelectItem value="merchant">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {t("client.merchant")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.senderClientType === "merchant" && (
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 md:col-span-2">
                      <div>
                        <Label htmlFor="senderCompanyName">
                          {t("company.name")}{" "}
                          <span className="text-red-500">
                            {t("common.required")}
                          </span>
                        </Label>
                        <Input
                          id="senderCompanyName"
                          value={formData.senderCompanyName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              senderCompanyName: e.target.value,
                            }))
                          }
                          placeholder={t("company.enterName")}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="commercialRegister">
                          {t("auth.commercialRegister")}{" "}
                          <span className="text-red-500">
                            {t("common.required")}
                          </span>
                        </Label>
                        <Input
                          id="commercialRegister"
                          value={formData.commercialRegister}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              commercialRegister: e.target.value,
                            }))
                          }
                          placeholder={t("form.enterCommercialRegister")}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Country, State, City Selection for Sender */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      {t("sender.country")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <GlobalCountrySelector
                      value={formData.senderCountry}
                      onChange={(country) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderCountry: country.code,
                          senderState: "",
                          senderCity: "",
                        }))
                      }
                      disabled={shippingType === "local"}
                      className="h-11 sm:h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      {t("sender.state")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <SearchableStateSelector
                      countryCode={formData.senderCountry}
                      value={formData.senderState}
                      onChange={(province) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderState: province.code,
                          senderCity: "",
                        }))
                      }
                      className="h-11 sm:h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      {t("sender.city")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.senderCity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderCity: e.target.value,
                        }))
                      }
                      placeholder={t("form.enterCity")}
                      className="h-11 sm:h-12 text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="senderStreet">
                    {t("sender.street")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="senderStreet"
                    value={formData.senderStreet}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        senderStreet: e.target.value,
                      }))
                    }
                    placeholder={t("sender.enterStreet")}
                    className="mt-2"
                  />
                </div>
                {/* <div>
                  <Label htmlFor="senderAddress">
                    {t("sender.detailedAddress")}{" "}
                    <span className="text-red-500">{t("common.required")}</span>
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="senderAddress"
                      value={formData.senderAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderAddress: e.target.value,
                        }))
                      }
                      placeholder={t("sender.enterDetailedAddress")}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openMapForLocation("sender")}
                    >
                      <Map className="w-4 h-4" />
                    </Button>
                  </div>
                </div> */}
                {/* {formData.senderCoordinates && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ {t("sender.locationSelected")}:{" "}
                      {formData.senderCoordinates.lat.toFixed(6)},{" "}
                      {formData.senderCoordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )} */}
              </div>
            )}

            {/* Step 3: Multiple Receivers Information (without client type) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium">
                      {t("receiver.titlePlural")} ({receivers.length})
                    </h3>
                  </div>
                  <Button onClick={addReceiver} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.addReceiver")}
                  </Button>
                </div>

                {receivers.map((receiver, index) => {
                  const receiverSelectedId =
                    selectedReceiverContactIds[receiver.id] ||
                    NEW_CONTACT_OPTION;

                  return (
                    <Card key={receiver.id} className="relative">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {t("receiver.number", { number: index + 1 })}
                          </CardTitle>
                          {receivers.length > 1 && (
                            <Button
                              onClick={() => removeReceiver(index)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="mb-4">
                          <Label>{t("sender.selectFromContacts")}</Label>
                          {shippingType === "local" && (
                            <p className="text-xs text-amber-700 mt-1">
                              {isRTL
                                ? "ملاحظة: في الشحن المحلي، الدولة تكون سوريا فقط وسيتم تنبيهك عند اختلاف بيانات العميل."
                                : "Note: For local shipping, the country must be Syria only, and you will be alerted if client data differs."}
                            </p>
                          )}
                          <Select
                            value={receiverSelectedId}
                            onValueChange={(value) =>
                              handleContactSelect(value, "receiver", index)
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue
                                placeholder={t("receiver.selectOrEnterNew")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="p-2 border-b">
                                <Input
                                  value={
                                    receiverContactSearch[receiver.id] || ""
                                  }
                                  onChange={(e) =>
                                    setReceiverContactSearch((prev) => ({
                                      ...prev,
                                      [receiver.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => e.stopPropagation()}
                                  placeholder={
                                    isRTL
                                      ? "ابحث عن عميل..."
                                      : "Search contact..."
                                  }
                                  className="h-9"
                                />
                              </div>
                              <SelectItem value={NEW_CONTACT_OPTION}>
                                {isRTL ? "مستلم جديد" : "New Receiver"}
                              </SelectItem>
                              {filterContactsBySearch(
                                getAvailableContacts(true, receiverSelectedId),
                                receiverContactSearch[receiver.id] || "",
                              ).map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {contact.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {contact.phone} - {contact.city}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>
                              {t("sender.name")}{" "}
                              <span className="text-red-500">
                                {t("common.required")}
                              </span>
                            </Label>
                            <Input
                              value={receiver.name}
                              onChange={(e) =>
                                updateReceiver(index, "name", e.target.value)
                              }
                              placeholder={t("receiver.enterName")}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>
                              {t("sender.phone")}{" "}
                              <span className="text-red-500">
                                {t("common.required")}
                              </span>
                            </Label>
                            <Input
                              type="tel"
                              value={receiver.phone}
                              onChange={(e) =>
                                updateReceiver(index, "phone", e.target.value)
                              }
                              placeholder="+963991234567"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>{t("sender.email")}</Label>
                            <Input
                              type="email"
                              value={receiver.email}
                              onChange={(e) =>
                                updateReceiver(index, "email", e.target.value)
                              }
                              placeholder="example@email.com"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>{t("sender.street")}</Label>
                            <Input
                              value={receiver.street}
                              onChange={(e) =>
                                updateReceiver(index, "street", e.target.value)
                              }
                              placeholder={t("sender.enterStreet")}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        {/* Country, State, City Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              {t("sender.country")}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <GlobalCountrySelector
                              value={receiver.country}
                              onChange={(country) =>
                                updateReceiver(index, "country", country.code)
                              }
                              disabled={shippingType === "local"}
                              className="h-11 sm:h-12"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              {t("sender.state")}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <SearchableStateSelector
                              countryCode={receiver.country}
                              value={receiver.state}
                              onChange={(province) =>
                                updateReceiver(index, "state", province.code)
                              }
                              className="h-11 sm:h-12"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              {t("sender.city")}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={receiver.city}
                              onChange={(e) =>
                                updateReceiver(index, "city", e.target.value)
                              }
                              placeholder={t("form.enterCity")}
                              className="h-11 sm:h-12 text-base"
                            />
                          </div>
                        </div>

                        {/* <div>
                        <Label>
                          {t("sender.detailedAddress")}{" "}
                          <span className="text-red-500">
                            {t("common.required")}
                          </span>
                        </Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={receiver.address}
                            onChange={(e) =>
                              updateReceiver(index, "address", e.target.value)
                            }
                            placeholder={t("receiver.enterDetailedAddress")}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              openMapForLocation("receiver", index)
                            }
                          >
                            <Map className="w-4 h-4" />
                          </Button>
                        </div>
                      </div> */}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Step 4: Package Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="packageType">
                      {t("package.type")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Select
                      value={formData.packageType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, packageType: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t("package.selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="documents">
                          {t("package.documents")}
                        </SelectItem>
                        <SelectItem value="electronics">
                          {t("package.electronics")}
                        </SelectItem>
                        <SelectItem value="clothing">
                          {t("package.clothing")}
                        </SelectItem>
                        <SelectItem value="books">
                          {t("package.books")}
                        </SelectItem>
                        <SelectItem value="gifts">
                          {t("package.gifts")}
                        </SelectItem>
                        <SelectItem value="food">
                          {t("package.food")}
                        </SelectItem>
                        <SelectItem value="other">
                          {t("package.other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">
                      {t("package.weight")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }))
                      }
                      placeholder="1.0"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">
                    {t("package.description")}{" "}
                    <span className="text-red-500">{t("common.required")}</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t("package.enterDescription")}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length">
                      {t("package.length")} (cm){" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      min="1"
                      value={formData.length}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          length: e.target.value,
                        }))
                      }
                      placeholder="10"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">
                      {t("package.width")} (cm){" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      value={formData.width}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          width: e.target.value,
                        }))
                      }
                      placeholder="10"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">
                      {t("package.height")} (cm){" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height: e.target.value,
                        }))
                      }
                      placeholder="10"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value">
                      {t("package.value")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder="100"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">
                      {t("currency.selectCurrency")}
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: "USD" | "SYP") =>
                        setFormData((prev) => ({ ...prev, currency: value }))
                      }
                      disabled={true} // Currency is auto-selected based on shipping type
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">
                          {t("currency.usd")} (USD)
                        </SelectItem>
                        <SelectItem value="SYP">
                          {t("currency.syp")} (SYP)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {/* <p className="text-xs text-gray-500 mt-1">
                      {shippingType === "local"
                        ? "الشحن المحلي - ليرة سورية"
                        : "الشحن الدولي - دولار أمريكي"}
                    </p> */}
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="fragile"
                    checked={formData.fragile}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fragile: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="fragile">{t("package.fragile")}</Label>
                </div>
              </div>
            )}

            {/* Step 5: Shipping & Payment */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">
                    {t("shipment.shippingCompany")}{" "}
                    <span className="text-red-500">{t("common.required")}</span>
                  </Label>
                  <p className="mt-2 text-xs text-slate-500">
                    اضغط مطولا على بطاقة الشركة لعرض معلومات الشركة بالكامل.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {getAvailableCompanies().map((company) => (
                      <div
                        key={company._id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.shippingCompany === company._id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleCompanyCardClick(company)}
                        onMouseDown={() => startCompanyLongPress(company)}
                        onMouseUp={endCompanyLongPress}
                        onMouseLeave={endCompanyLongPress}
                        onTouchStart={() => startCompanyLongPress(company)}
                        onTouchEnd={endCompanyLongPress}
                        onTouchCancel={endCompanyLongPress}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {company.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-10 w-10 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                                LOGO
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{company.name}</h3>
                              <p className="text-sm text-gray-600">
                                {shippingType === "local"
                                  ? "شحن محلي بالليرة السورية"
                                  : "شحن دولي بالدولار الأمريكي"}
                              </p>
                              {company.codService?.enabled ? (
                                <p className="text-xs text-green-700 mt-1">
                                  الدفع عند الاستلام متاح برسوم{" "}
                                  {formatAmount(
                                    shippingType === "local"
                                      ? company.codService.localFeeSYP || 0
                                      : company.codService
                                          .internationalFeeUSD || 0,
                                    formData.currency,
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500 mt-1">
                                  الدفع عند الاستلام غير متاح
                                </p>
                              )}

                              {company.packagingService?.enabled ? (
                                <p className="text-xs text-blue-700 mt-1">
                                  خدمة التغليف متاحة برسوم{" "}
                                  {formatAmount(
                                    shippingType === "local"
                                      ? company.packagingService.localFeeSYP ||
                                          0
                                      : company.packagingService
                                          .internationalFeeUSD || 0,
                                    formData.currency,
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500 mt-1">
                                  خدمة التغليف غير متاحة
                                </p>
                              )}
                            </div>
                          </div>
                          {company.supportsLocal &&
                            !company.supportsInternational && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {t("shipment.local")}
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {estimatedCost > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                    {/* تفاصيل الوزن والحساب */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900 text-sm">
                        {t("package.weightCalculation")}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">
                            {t("package.actualWeight")}:
                          </span>
                          <span className="font-medium ml-2">
                            {parseFloat(formData.weight) || 0} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">
                            {t("package.volumetricWeight")}:
                          </span>
                          <span className="font-medium ml-2">
                            {formData.length &&
                            formData.width &&
                            formData.height
                              ? (
                                  (parseFloat(formData.length) *
                                    parseFloat(formData.width) *
                                    parseFloat(formData.height)) /
                                  getSelectedVolumetricDivisor()
                                ).toFixed(2)
                              : "0.00"}{" "}
                            kg
                          </span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">
                          {t("package.billingWeight")}:
                        </span>
                        <span className="font-medium ml-2 text-blue-700">
                          {formData.weight &&
                          formData.length &&
                          formData.width &&
                          formData.height
                            ? Math.max(
                                parseFloat(formData.weight),
                                (parseFloat(formData.length) *
                                  parseFloat(formData.width) *
                                  parseFloat(formData.height)) /
                                  getSelectedVolumetricDivisor(),
                              ).toFixed(2)
                            : (parseFloat(formData.weight) || 0).toFixed(
                                2,
                              )}{" "}
                          kg
                        </span>
                      </div>
                    </div>

                    {/* إجمالي التكلفة */}
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-blue-900">تكلفة الشحن</span>
                        <span className="font-semibold text-blue-900">
                          {formatAmount(estimatedCost, formData.currency)}
                        </span>
                      </div>
                      {getCodFee() > 0 && (
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-blue-900">
                            رسوم الدفع عند الاستلام
                          </span>
                          <span className="font-semibold text-blue-900">
                            {formatAmount(getCodFee(), formData.currency)}
                          </span>
                        </div>
                      )}
                      {getPackagingFee() > 0 && (
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-blue-900">
                            {t("package.packagingFee")}
                          </span>
                          <span className="font-semibold text-blue-900">
                            {formatAmount(getPackagingFee(), formData.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {t("shipment.totalCostFor", {
                              count: receivers.length,
                            })}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          {formatAmount(totalCostWithFees, formData.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium">
                    {t("shipment.paymentMethod")}{" "}
                    <span className="text-red-500">{t("common.required")}</span>
                  </Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value: "wallet" | "cod") =>
                      setFormData((prev) => ({ ...prev, paymentMethod: value }))
                    }
                    className="mt-4 space-y-3"
                  >
                    {/* Wallet Payment */}
                    <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label
                        htmlFor="wallet"
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <Wallet className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium">
                            {t("shipment.wallet")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t("balance.availableBalance")}
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="inline-flex items-center justify-between rounded-md border bg-slate-50 px-3 py-1.5 font-medium tabular-nums min-w-[170px]">
                              <span>USD</span>
                              <span>
                                {formatWalletBalanceNumber(
                                  userBalance.USD,
                                  "USD",
                                )}
                              </span>
                            </div>
                            <div className="inline-flex items-center justify-between rounded-md border bg-slate-50 px-3 py-1.5 font-medium tabular-nums min-w-[170px]">
                              <span>SYP</span>
                              <span>
                                {formatWalletBalanceNumber(
                                  userBalance.SYP,
                                  "SYP",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Cash on Delivery */}
                    <div
                      className={`flex items-center space-x-3 space-x-reverse p-3 border rounded-lg ${
                        getSelectedCompany() &&
                        !getSelectedCompany()?.codService?.enabled
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <RadioGroupItem
                        value="cod"
                        id="cod"
                        disabled={
                          !!getSelectedCompany() &&
                          !getSelectedCompany()?.codService?.enabled
                        }
                      />
                      <Label
                        htmlFor="cod"
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <DollarSign className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium">
                            {t("shipment.cashOnDelivery")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getSelectedCompany() &&
                            !getSelectedCompany()?.codService?.enabled
                              ? "غير متاح في الشركة المحددة"
                              : t("payment.cod.desc")}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {t("package.packagingRequested")}
                  </Label>
                  <div
                    className={`mt-3 rounded-lg border p-3 ${
                      getSelectedCompany() &&
                      !getSelectedCompany()?.packagingService?.enabled
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id="packagingRequestedStep5"
                        checked={formData.packagingRequested}
                        disabled={
                          !!getSelectedCompany() &&
                          !getSelectedCompany()?.packagingService?.enabled
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            packagingRequested: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor="packagingRequestedStep5"
                        className="cursor-pointer"
                      >
                        {t("package.packagingRequested")}
                      </Label>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {getSelectedCompany() &&
                      !getSelectedCompany()?.packagingService?.enabled
                        ? isRTL
                          ? "خدمة التغليف غير متاحة في الشركة المحددة"
                          : "Packaging service is not available for the selected company"
                        : `${t("package.packagingFee")}: ${formatAmount(getPackagingFee(), formData.currency)}`}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">{t("shipment.additionalNotes")}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t("shipment.enterNotes")}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Review Shipment */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("shipment.reviewDetails")}
                  </h3>
                  <p className="text-gray-600">{t("shipment.reviewDesc")}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sender Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {t("sender.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("sender.name")}:
                        </span>
                        <span className="font-medium">
                          {formData.senderName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("client.type")}:
                        </span>
                        <div className="flex items-center gap-1">
                          {React.createElement(
                            getClientTypeIcon(formData.senderClientType),
                            { className: "w-4 h-4" },
                          )}
                          <span className="font-medium">
                            {getClientTypeLabel(formData.senderClientType)}
                          </span>
                        </div>
                      </div>
                      {formData.senderClientType === "merchant" &&
                        formData.senderCompanyName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {t("company.name")}:
                            </span>
                            <span className="font-medium">
                              {formData.senderCompanyName}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("sender.phone")}:
                        </span>
                        <span className="font-medium">
                          {formData.senderPhone}
                        </span>
                      </div>
                      {formData.senderEmail && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("sender.email")}:
                          </span>
                          <span className="font-medium">
                            {formData.senderEmail}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("sender.city")}:
                        </span>
                        <span className="font-medium">
                          {formData.senderCity}, {formData.senderState}
                        </span>
                      </div>
                      {formData.senderStreet && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("sender.street")}:
                          </span>
                          <span className="font-medium">
                            {formData.senderStreet}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("sender.address")}:
                        </span>
                        <span className="font-medium">
                          {formData.senderAddress}
                        </span>
                      </div>
                      {formData.senderClientType === "merchant" &&
                        formData.senderCompanyDocuments.length > 0 && (
                          <div className="pt-2 border-t">
                            <span className="text-gray-600 text-sm">
                              {t("company.documents")}:
                            </span>
                            <p className="font-medium mt-1">
                              {formData.senderCompanyDocuments.length}{" "}
                              {t("company.filesUploaded")}
                            </p>
                          </div>
                        )}
                    </CardContent>
                  </Card>

                  {/* Package Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {t("package.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("package.type")}:
                        </span>
                        <span className="font-medium">
                          {getPackageTypeLabel(formData.packageType)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("package.weight")}:
                        </span>
                        <span className="font-medium">
                          {formData.weight} kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("package.dimensions")}:
                        </span>
                        <span className="font-medium">
                          {formData.length} × {formData.width} ×{" "}
                          {formData.height} cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("package.value")}:
                        </span>
                        <span className="font-medium">
                          {formData.value} {formData.currency}
                        </span>
                      </div>
                      {formData.fragile && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("package.fragile")}:
                          </span>
                          <span className="font-medium text-orange-600">
                            {t("common.yes")}
                          </span>
                        </div>
                      )}
                      {formData.packagingRequested && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("package.packaging")}:
                          </span>
                          <span className="font-medium text-blue-700">
                            {t("common.yes")}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 text-sm">
                          {t("package.description")}:
                        </span>
                        <p className="font-medium mt-1">
                          {formData.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Receivers Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {t("receiver.titlePlural")} ({receivers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {receivers.map((receiver, index) => (
                        <div
                          key={receiver.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <h4 className="font-medium mb-3">
                            {t("receiver.number", { number: index + 1 })}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("sender.name")}:
                              </span>
                              <span className="font-medium">
                                {receiver.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("sender.phone")}:
                              </span>
                              <span className="font-medium">
                                {receiver.phone}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("sender.city")}:
                              </span>
                              <span className="font-medium">
                                {receiver.city}, {receiver.state}
                              </span>
                            </div>
                            {receiver.street && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("sender.street")}:
                                </span>
                                <span className="font-medium">
                                  {receiver.street}
                                </span>
                              </div>
                            )}
                            <div className="md:col-span-2 flex justify-between">
                              <span className="text-gray-600">
                                {t("sender.address")}:
                              </span>
                              <span className="font-medium">
                                {receiver.address}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping & Payment Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        {t("shipment.shippingInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("shipment.shippingType")}:
                        </span>
                        <span className="font-medium">
                          {shippingType === "local"
                            ? t("shipment.local")
                            : t("shipment.international")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("shipment.shippingCompany")}:
                        </span>
                        <span className="font-medium">
                          {getSelectedCompany()?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("shipment.paymentMethod")}:
                        </span>
                        <span className="font-medium">
                          {getPaymentMethodLabel(formData.paymentMethod)}
                        </span>
                      </div>
                      {formData.notes && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-600 text-sm">
                            {t("shipment.notes")}:
                          </span>
                          <p className="font-medium mt-1">{formData.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        {t("shipment.costSummary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("receiver.count")}:
                        </span>
                        <span className="font-medium">{receivers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("package.weight")}:
                        </span>
                        <span className="font-medium">
                          {formData.weight} kg
                        </span>
                      </div>
                      {getCodFee() > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">COD:</span>
                          <span className="font-medium">
                            {formatAmount(getCodFee(), formData.currency)}
                          </span>
                        </div>
                      )}
                      {getPackagingFee() > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("package.packagingFee")}:
                          </span>
                          <span className="font-medium">
                            {formatAmount(getPackagingFee(), formData.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t">
                        <span className="text-lg font-semibold">
                          {t("shipment.totalCost")}:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatAmount(totalCostWithFees, formData.currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-center gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(5)}
                    size="lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={operationStatus.isLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("shipment.confirmCreate")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 6 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {t("shipment.previous")}
            </Button>

            <Button onClick={nextStep} size="lg">
              {currentStep === 5
                ? t("shipment.reviewShipment")
                : t("shipment.next")}
              <ArrowLeft className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Map Dialog */}
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("sender.selectLocationOnMap")}</DialogTitle>
              <DialogDescription>
                {t("sender.clickToSelectLocation")}{" "}
                {currentMapTarget === "sender"
                  ? t("sender.title")
                  : `${t("receiver.title")} ${t("receiver.number", {
                      number: currentReceiverIndex + 1,
                    })}`}
              </DialogDescription>
            </DialogHeader>
            <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t("sender.interactiveMap")}</p>
                <p className="text-sm text-gray-500">
                  {t("sender.clickToSelect")}
                </p>
                <Button
                  className="mt-4"
                  onClick={() =>
                    handleMapLocationSelect({ lat: 33.5138, lng: 36.2765 })
                  }
                >
                  {t("sender.selectThisLocation")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isCompanyInfoOpen}
          onOpenChange={(open) => {
            setIsCompanyInfoOpen(open);
            if (!open) {
              setPreviewCompany(null);
            }
          }}
        >
          <DialogContent className="w-[96vw] max-w-4xl max-h-[92vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {language === "ar"
                  ? "معلومات شركة الشحن"
                  : "Shipping Company Information"}
              </DialogTitle>
              <DialogDescription>
                {language === "ar"
                  ? "تفاصيل الشركة المختارة ضمن خطوة الشحن والدفع."
                  : "Details of the selected company in shipping and payment step."}
              </DialogDescription>
            </DialogHeader>

            {previewCompany && (
              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-4 rounded-xl border bg-slate-50 p-4">
                  {previewCompany.logoUrl ? (
                    <img
                      src={previewCompany.logoUrl}
                      alt={previewCompany.name}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-white flex items-center justify-center text-slate-500 text-xs border">
                      LOGO
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {previewCompany.name}
                    </h3>
                    <p className="text-slate-600 mt-1">
                      {language === "ar" ? "الكود:" : "Code:"}{" "}
                      {previewCompany.code}
                    </p>
                    <p className="text-slate-600 mt-1">
                      {language === "ar" ? "التغطية:" : "Coverage:"}{" "}
                      {getCompanyCoverageLabel(previewCompany)}
                    </p>
                  </div>
                </div>

                {previewCompany.description && (
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <p className="text-slate-500 mb-2">
                      {language === "ar" ? "وصف الشركة" : "Company Description"}
                    </p>
                    <div className="max-h-56 overflow-y-auto pr-1">
                      <p className="text-slate-700 leading-7 whitespace-pre-wrap break-words">
                        {previewCompany.description}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-4 md:col-span-1">
                    <p className="text-slate-500">
                      {language === "ar"
                        ? "سعر الكيلو الحالي"
                        : "Current Price Per Kg"}
                    </p>
                    <p className="font-semibold text-slate-900 mt-2 text-base">
                      {getCompanyPriceLabel(previewCompany)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 md:col-span-2">
                    <p className="text-slate-500">
                      {language === "ar"
                        ? "الدول المدعومة"
                        : "Supported Countries"}
                    </p>
                    <p className="font-semibold text-slate-900 mt-2 break-words leading-7">
                      {getCompanySupportedCountriesLabel(previewCompany)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-slate-500">
                    {language === "ar"
                      ? "حالة الدفع عند الاستلام"
                      : "Cash On Delivery Status"}
                  </p>
                  <p className="font-semibold mt-2 text-base">
                    {previewCompany.codService?.enabled
                      ? `${language === "ar" ? "متاح برسوم" : "Available with fee"} ${formatAmount(
                          shippingType === "local"
                            ? previewCompany.codService.localFeeSYP || 0
                            : previewCompany.codService.internationalFeeUSD ||
                                0,
                          formData.currency,
                        )}`
                      : language === "ar"
                        ? "غير متاح"
                        : "Not available"}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {language === "ar"
                    ? "اضغط نقرة عادية لاختيار الشركة، واضغط مطولا لعرض التفاصيل."
                    : "Tap to select the company, and long press to view details."}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Operation Status Overlay */}
      <OperationStatus
        state={operationStatus.state}
        title={t("shipment.create")}
        loadingMessage={t("shipment.creating")}
        successMessage={t("shipment.createSuccess")}
        errorMessage={operationStatus.errorMessage || t("shipment.createError")}
        onRetry={handleOperationRetry}
        onContinue={handleOperationSuccess}
        onClose={() => operationStatus.reset()}
      />
    </div>
  );
}
