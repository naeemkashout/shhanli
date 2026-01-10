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
import { useNavigate } from "react-router-dom";
import OperationStatus from "@/components/OperationStatus";
import { useOperationStatus } from "@/hooks/useOperationStatus";

interface Contact {
  id: string;
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
  id: string;
  name: string;
  supportedCountries: string[];
  localOnly?: boolean;
  pricePerKg: { [country: string]: number };
}

interface Country {
  code: string;
  name: string;
  states: { [key: string]: string[] };
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "أحمد محمد",
    phone: "+963991234567",
    email: "ahmed@example.com",
    address: "شارع الملك فيصل، حي السلامانية",
    street: "شارع الملك فيصل",
    city: "aleepo",
    state: "test",
    country: "سوريا",
    clientType: "merchant",
    companyName: "شركة التجارة المتقدمة",
    coordinates: { lat: 36.2021, lng: 37.1343 },
  },
  {
    id: "2",
    name: "فاطمة علي",
    phone: "+963987654321",
    email: "fatima@example.com",
    address: "شارع النور، حي الحرة",
    street: "شارع النور",
    city: "دمشق",
    state: "دمشق",
    country: "سوريا",
    clientType: "individual",
    coordinates: { lat: 33.5138, lng: 36.2765 },
  },
  {
    id: "3",
    name: "محمد حسن",
    phone: "+963982222222",
    email: "mohamed@example.com",
    address: "شارع الثورة، حي الوعر",
    street: "شارع الثورة",
    city: "حمص",
    state: "حمص",
    country: "سوريا",
    clientType: "merchant",
    companyName: "مؤسسة الشرق للتجارة",
  },
  {
    id: "4",
    name: "سارة أحمد",
    phone: "+963933333333",
    email: "sara@example.com",
    address: "شارع الجامعة، حي المزة",
    street: "شارع الجامعة",
    city: "دمشق",
    state: "دمشق",
    country: "سوريا",
    clientType: "individual",
  },
  {
    id: "5",
    name: "علي حسن",
    phone: "+963944444444",
    email: "ali@example.com",
    address: "شارع الكورنيش، حي الشاطئ الأزرق",
    street: "شارع الكورنيش",
    city: "اللاذقية",
    state: "اللاذقية",
    country: "سوريا",
    clientType: "merchant",
    companyName: "شركة البحر الأبيض للاستيراد",
  },
];

const shippingCompanies: ShippingCompany[] = [
  {
    id: "aramex",
    name: "أرامكس",
    supportedCountries: [
      "سوريا",
      "لبنان",
      "الأردن",
      "الإمارات",
      "السعودية",
      "مصر",
    ],
    pricePerKg: { سوريا: 5000, لبنان: 15, الأردن: 12, الإمارات: 25 },
  },
  {
    id: "dhl",
    name: "DHL",
    supportedCountries: [
      "سوريا",
      "لبنان",
      "الأردن",
      "الإمارات",
      "السعودية",
      "مصر",
      "تركيا",
      "ألمانيا",
      "فرنسا",
    ],
    pricePerKg: { سوريا: 8000, لبنان: 20, تركيا: 30, ألمانيا: 45 },
  },
  {
    id: "syria_express",
    name: "سوريا إكسبريس",
    supportedCountries: ["سوريا"],
    localOnly: true,
    pricePerKg: { سوريا: 3000 },
  },
];

const countries: Country[] = [
  {
    code: "SY",
    name: "سوريا",
    states: {
      دمشق: ["damascus", "جرمانا", "دوما", "قطنا"],
      damascus: ["damascus", "جرمانا", "دوما", "قطنا"],
      حلب: ["حلب", "عفرين", "اعزاز", "الباب"],
      حمص: ["حمص", "تدمر", "القريتين", "الرستن"],
      حماة: ["حماة", "سلمية", "مصياف", "السقيلبية"],
      اللاذقية: ["اللاذقية", "جبلة", "القرداحة", "الحفة"],
      طرطوس: ["طرطوس", "بانياس", "صافيتا", "الدريكيش"],
      درعا: ["درعا", "إزرع", "الصنمين", "نوى"],
      السويداء: ["السويداء", "صلخد", "شهبا", "قريا"],
      القنيطرة: ["القنيطرة", "فيق", "خان أرنبة"],
      "دير الزور": ["دير الزور", "الميادين", "البوكمال", "الشحيل"],
      الرقة: ["الرقة", "تل أبيض", "سلوك", "معدان"],
      الحسكة: ["الحسكة", "القامشلي", "رأس العين", "المالكية"],
      إدلب: ["إدلب", "جسر الشغور", "أريحا", "معرة النعمان"],
    },
  },
  {
    code: "LB",
    name: "لبنان",
    states: {
      بيروت: ["بيروت"],
      "جبل لبنان": ["جونية", "بعبدا", "عاليه", "المتن"],
      الشمال: ["طرابلس", "زغرتا", "الكورة", "المنية الضنية"],
      الجنوب: ["صيدا", "صور", "النبطية", "مرجعيون"],
      البقاع: ["زحلة", "بعلبك", "الهرمل", "راشيا"],
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
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const operationStatus = useOperationStatus();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingType, setShippingType] = useState<"local" | "international">(
    "local"
  );
  const [contacts] = useState<Contact[]>(mockContacts);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [currentMapTarget, setCurrentMapTarget] = useState<
    "sender" | "receiver"
  >("sender");
  const [currentReceiverIndex, setCurrentReceiverIndex] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [userBalance] = useState({ USD: 250.75, SYP: 1250000 });
  const [usedContactIds, setUsedContactIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    // Sender Info
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    senderAddress: "",
    senderStreet: "",
    commercialRegister: "",
    senderCountry: t("common.syria"),
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
      country: t("common.syria"),
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
        senderCountry: t("common.syria"),
        currency: "SYP", // Local shipping uses SYP
      }));
      setReceivers((prev) =>
        prev.map((receiver) => ({ ...receiver, country: t("common.syria") }))
      );
    } else {
      // International shipping uses USD
      setFormData((prev) => ({
        ...prev,
        currency: "USD",
      }));
    }
  }, [shippingType, t]);

  // Calculate estimated cost
  useEffect(() => {
    if (formData.weight && formData.shippingCompany && receivers.length > 0) {
      const company = shippingCompanies.find(
        (c) => c.id === formData.shippingCompany
      );
      if (company) {
        const weight = parseFloat(formData.weight);
        let totalCost = 0;

        receivers.forEach((receiver) => {
          if (receiver.country && company.pricePerKg[receiver.country]) {
            totalCost += weight * company.pricePerKg[receiver.country];
          }
        });

        setEstimatedCost(totalCost);
      }
    }
  }, [formData.weight, formData.shippingCompany, receivers]);

  // Update used contact IDs when receivers change
  useEffect(() => {
    const receiverContactIds = receivers
      .map(
        (receiver) =>
          contacts.find(
            (c) => c.name === receiver.name && c.phone === receiver.phone
          )?.id
      )
      .filter(Boolean) as string[];

    const senderContactId = contacts.find(
      (c) => c.name === formData.senderName && c.phone === formData.senderPhone
    )?.id;

    const allUsedIds = [...receiverContactIds];
    if (senderContactId) {
      allUsedIds.push(senderContactId);
    }

    setUsedContactIds(allUsedIds);
  }, [receivers, formData.senderName, formData.senderPhone, contacts]);

  const getAvailableCompanies = () => {
    if (receivers.length === 0) return [];

    // Get companies that support all receiver countries
    const receiverCountries = [
      ...new Set(receivers.map((r) => r.country).filter(Boolean)),
    ];

    return shippingCompanies.filter((company) =>
      receiverCountries.every((country) =>
        company.supportedCountries.includes(country)
      )
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

  const getAvailableContacts = (forReceiver: boolean = false) => {
    return contacts.filter((contact) => !usedContactIds.includes(contact.id));
  };

  const handleContactSelect = (
    contactId: string,
    type: "sender" | "receiver",
    receiverIndex?: number
  ) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      if (type === "sender") {
        setFormData((prev) => ({
          ...prev,
          senderName: contact.name,
          senderPhone: contact.phone,
          senderEmail: contact.email || "",
          senderAddress: contact.address,
          senderStreet: contact.street || "",
          senderCountry: contact.country,
          senderState: contact.state,
          senderCity: contact.city,
          senderClientType: contact.clientType,
          senderCompanyName: contact.companyName || "",
          senderCoordinates: contact.coordinates || null,
        }));
      } else if (type === "receiver" && receiverIndex !== undefined) {
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
                  country: contact.country,
                  state: contact.state,
                  city: contact.city,
                  coordinates: contact.coordinates || null,
                }
              : receiver
          )
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
      country: shippingType === "local" ? t("common.syria") : "",
      state: "",
      city: "",
      coordinates: null,
    };
    setReceivers((prev) => [...prev, newReceiver]);
  };

  const removeReceiver = (index: number) => {
    if (receivers.length > 1) {
      setReceivers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateReceiver = (
    index: number,
    field: string,
    value: string | { lat: number; lng: number } | null
  ) => {
    setReceivers((prev) =>
      prev.map((receiver, i) =>
        i === index ? { ...receiver, [field]: value } : receiver
      )
    );
  };

  const openMapForLocation = (
    target: "sender" | "receiver",
    receiverIndex?: number
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
            : receiver
        )
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
        (_, i) => i !== index
      ),
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 2:
        if (
          !formData.senderName ||
          !formData.senderPhone ||
          !formData.senderAddress ||
          !formData.senderCountry ||
          !formData.senderState ||
          !formData.senderCity ||
          !formData.senderStreet ||
          formData.senderClientType == "merchant"
            ? formData.senderCompanyName && !formData.commercialRegister
            : ""
        ) {
          toast.error(t("msg.fillSenderRequired"));
          return false;
        }
        if (
          !formData.senderCountry ||
          !formData.senderState ||
          !formData.senderCity
        ) {
          toast.error(t("msg.selectSenderLocation"));
          return false;
        }
        if (
          formData.senderClientType === "merchant" &&
          !formData.senderCompanyName
        ) {
          toast.error(t("msg.fillCompanyName"));
          return false;
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
        if (!formData.paymentMethod) {
          toast.error(t("msg.selectPaymentMethod"));
          return false;
        }
        if (formData.paymentMethod === "wallet") {
          const currency = formData.currency === "USD" ? "USD" : "SYP";
          const balance = userBalance[currency];
          if (estimatedCost > balance) {
            toast.error(
              t("msg.insufficientBalance", {
                balance: balance.toLocaleString(),
                currency,
              })
            );
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const simulateShipmentCreation = async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random success/failure (90% success rate)
    if (Math.random() > 0.1) {
      // Success
      return;
    } else {
      // Failure
      throw new Error("فشل في إنشاء الشحنة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleSubmit = async () => {
    await operationStatus.executeOperation(async () => {
      await simulateShipmentCreation();
    });
  };

  const handleOperationSuccess = () => {
    operationStatus.reset();
    navigate("/shipments");
    toast.success(
      t("msg.shipmentCreatedMultiple", { count: receivers.length })
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

  const getSelectedCompany = () => {
    return shippingCompanies.find((c) => c.id === formData.shippingCompany);
  };

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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("shipment.title")}
          </h1>

          {/* Progress Steps */}
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

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Step 1: Shipping Type */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* Local Shipping */}
                  <div
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      shippingType === "local"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setShippingType("local")}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("shipment.local")}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {t("shipment.localDesc")}
                      </p>
                      <p className="text-blue-600 text-sm font-medium">
                        3 {t("shipment.companiesAvailable")}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        الدفع بالليرة السورية حصراً
                      </p>
                    </div>
                  </div>

                  {/* International Shipping */}
                  <div
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      shippingType === "international"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setShippingType("international")}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("shipment.international")}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {t("shipment.internationalDesc")}
                      </p>
                      <p className="text-green-600 text-sm font-medium">
                        2 {t("shipment.companiesAvailable")}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        الدفع بالدولار الأمريكي
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Sender Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <Label>{t("sender.selectFromContacts")}</Label>
                  <Select
                    onValueChange={(value) =>
                      handleContactSelect(value, "sender")
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t("sender.selectOrEnterNew")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableContacts().map((contact) => {
                        const ClientIcon = getClientTypeIcon(
                          contact.clientType
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
                    <Label htmlFor="senderEmail">{t("sender.email")}</Label>
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
                    <Label htmlFor="senderCountry">
                      {t("sender.country")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Select
                      value={formData.senderCountry}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderCountry: value,
                          senderState: "",
                          senderCity: "",
                        }))
                      }
                      disabled={shippingType === "local"}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t("common.selectCountry")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {t(`common.${country.code.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="senderState">
                      {t("sender.state")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Select
                      value={formData.senderState}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          senderState: value,
                          senderCity: "",
                        }))
                      }
                      disabled={!formData.senderCountry}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t("common.selectState")} />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatesForCountry(formData.senderCountry).map(
                          (state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="senderCity">
                      {t("sender.city")}{" "}
                      <span className="text-red-500">
                        {t("common.required")}
                      </span>
                    </Label>
                    <Select
                      value={formData.senderCity}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, senderCity: value }))
                      }
                      disabled={!formData.senderState}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t("common.selectCity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesForState(
                          formData.senderCountry,
                          formData.senderState
                        ).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="senderStreet">{t("sender.street")}</Label>
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

                {receivers.map((receiver, index) => (
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
                        <Select
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
                            {getAvailableContacts(true).map((contact) => (
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
                          <Label>
                            {t("sender.country")}{" "}
                            <span className="text-red-500">
                              {t("common.required")}
                            </span>
                          </Label>
                          <Select
                            value={receiver.country}
                            onValueChange={(value) =>
                              updateReceiver(index, "country", value)
                            }
                            disabled={shippingType === "local"}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue
                                placeholder={t("common.selectCountry")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.name}
                                >
                                  {t(`common.${country.code.toLowerCase()}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>
                            {t("sender.state")}{" "}
                            <span className="text-red-500">
                              {t("common.required")}
                            </span>
                          </Label>
                          <Select
                            value={receiver.state}
                            onValueChange={(value) =>
                              updateReceiver(index, "state", value)
                            }
                            disabled={!receiver.country}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue
                                placeholder={t("common.selectState")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {getStatesForCountry(receiver.country).map(
                                (state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>
                            {t("sender.city")}{" "}
                            <span className="text-red-500">
                              {t("common.required")}
                            </span>
                          </Label>
                          <Select
                            value={receiver.city}
                            onValueChange={(value) =>
                              updateReceiver(index, "city", value)
                            }
                            disabled={!receiver.state}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue
                                placeholder={t("common.selectCity")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {getCitiesForState(
                                receiver.country,
                                receiver.state
                              ).map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {getAvailableCompanies().map((company) => (
                      <div
                        key={company.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.shippingCompany === company.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            shippingCompany: company.id,
                          }))
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{company.name}</h3>
                            <p className="text-sm text-gray-600">
                              {t("shipment.supportsAllCountries")}
                            </p>
                          </div>
                          {company.localOnly && (
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
                  <div className="p-4 bg-blue-50 rounded-lg">
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
                        {formatAmount(estimatedCost, formData.currency)}
                      </span>
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
                            {t("balance.availableBalance")}:{" "}
                            {formatAmount(userBalance.USD, "USD")} |{" "}
                            {formatAmount(userBalance.SYP, "SYP")}
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Cash on Delivery */}
                    <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
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
                            {t("payment.cod.desc")}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
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
                            { className: "w-4 h-4" }
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
                      <div className="flex justify-between pt-3 border-t">
                        <span className="text-lg font-semibold">
                          {t("shipment.totalCost")}:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatAmount(estimatedCost, formData.currency)}
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
      </div>

      {/* Operation Status Overlay */}
      <OperationStatus
        state={operationStatus.state}
        title={t("shipment.create")}
        loadingMessage={t("shipment.creating")}
        successMessage={t("shipment.createSuccess")}
        errorMessage={t("shipment.createError")}
        onRetry={handleOperationRetry}
        onContinue={handleOperationSuccess}
        onClose={() => operationStatus.reset()}
      />
    </div>
  );
}
