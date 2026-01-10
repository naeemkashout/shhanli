import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Mail,
  Building,
  UserCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

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
  type: "sender" | "receiver" | "both";
  clientType: "individual" | "merchant";
  companyName?: string;
  commercialRegister?: string;
}

interface Country {
  code: string;
  name: string;
  states: { [key: string]: string[] };
}

const countries: Country[] = [
  {
    code: "SY",
    name: "سوريا",
    states: {
      دمشق: ["دمشق", "جرمانا", "دوما", "قطنا"],
      حلب: ["حلب", "عفرين", "اعزاز", "الباب"],
      حمص: ["حمص", "تدمر", "القريتين", "الرستن"],
      حماة: ["حماة", "سلمية", "مصياف", "السقيلبية"],
      اللاذقية: ["اللاذقية", "جبلة", "القرداحة", "الحفة"],
      طرطوس: ["طرطوس", "بانياس", "صافيتا", "الدريكيش"],
    },
  },
  {
    code: "LB",
    name: "لبنان",
    states: {
      بيروت: ["بيروت"],
      "جبل لبنان": ["جونية", "بعبدا", "عاليه", "المتن"],
      الشمال: ["طرابلس", "زغرتا", "الكورة", "المنية الضنية"],
    },
  },
];

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "أحمد محمد",
    phone: "+963991234567",
    email: "ahmed@example.com",
    address: "شارع الملك فيصل، حي السلامانية",
    street: "شارع الملك فيصل",
    city: "حلب",
    state: "حلب",
    country: "سوريا",
    type: "both",
    clientType: "merchant",
    companyName: "شركة أحمد التجارية",
    commercialRegister: "12345678",
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
    type: "receiver",
    clientType: "individual",
  },
  {
    id: "3",
    name: "محمد سالم",
    phone: "+963982222222",
    email: "mohamed@example.com",
    address: "شارع الثورة، حي الوعر",
    street: "شارع الثورة",
    city: "حمص",
    state: "حمص",
    country: "سوريا",
    type: "sender",
    clientType: "merchant",
    companyName: "مؤسسة سالم للتجارة",
    commercialRegister: "87654321",
  },
];

export default function Contacts() {
  const { t, isRTL } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    email: "",
    address: "",
    street: "",
    country: "سوريا",
    state: "",
    city: "",
    type: "both",
    clientType: "individual",
    companyName: "",
    commercialRegister: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    const matchesClientType =
      clientTypeFilter === "all" || contact.clientType === clientTypeFilter;

    return matchesSearch && matchesType && matchesClientType;
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name?.trim()) {
      newErrors.name = t("validation.firstNameRequired");
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = t("validation.phoneRequired");
    }
    if (!formData.address?.trim()) {
      newErrors.address = t("validation.streetRequired");
    }
    if (!formData.country) {
      newErrors.country = t("validation.countryRequired");
    }
    if (!formData.state) {
      newErrors.state = t("validation.provinceRequired");
    }
    if (!formData.city) {
      newErrors.city = t("validation.cityRequired");
    }

    // Merchant specific validation
    if (formData.clientType === "merchant") {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = t("validation.companyNameRequired");
      }
      if (!formData.commercialRegister?.trim()) {
        newErrors.commercialRegister = t(
          "validation.commercialRegisterRequired"
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddContact = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      street: "",
      country: "سوريا",
      state: "",
      city: "",
      type: "both",
      clientType: "individual",
      companyName: "",
      commercialRegister: "",
    });
    setErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({ ...contact });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      toast.success(t("contacts.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleSaveContact = () => {
    if (!validateForm()) {
      return;
    }

    if (selectedContact) {
      // Edit existing contact
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? ({ ...formData, id: selectedContact.id } as Contact)
            : c
        )
      );
      toast.success(t("contacts.updateSuccess"));
      setIsEditDialogOpen(false);
    } else {
      // Add new contact
      const newContact: Contact = {
        ...formData,
        id: Date.now().toString(),
      } as Contact;
      setContacts((prev) => [...prev, newContact]);
      toast.success(t("contacts.addSuccess"));
      setIsAddDialogOpen(false);
    }

    setSelectedContact(null);
    setErrors({});
  };
  const { language } = useLanguage();
  const handleInputChange = (field: keyof Contact, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sender":
        return "bg-blue-100 text-blue-800";
      case "receiver":
        return "bg-green-100 text-green-800";
      case "both":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getClientTypeColor = (clientType: string) => {
    switch (clientType) {
      case "individual":
        return "bg-orange-100 text-orange-800";
      case "merchant":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sender":
        return t("contacts.sender");
      case "receiver":
        return t("contacts.receiver");
      case "both":
        return t("contacts.both");
      default:
        return type;
    }
  };

  const getClientTypeLabel = (clientType: string) => {
    switch (clientType) {
      case "individual":
        return t("client.individual");
      case "merchant":
        return t("client.merchant");
      default:
        return clientType;
    }
  };

  const getClientTypeIcon = (clientType: string) => {
    return clientType === "individual" ? User : Building;
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("contacts.title")}
        </h1>
        <Button onClick={handleAddContact}>
          <Plus className="w-4 h-4 mr-2" />
          {t("contacts.addContact")}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("contacts.searchContacts")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("contacts.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("contacts.allTypes")}</SelectItem>
                <SelectItem value="sender">{t("contacts.sender")}</SelectItem>
                <SelectItem value="receiver">
                  {t("contacts.receiver")}
                </SelectItem>
                <SelectItem value="both">{t("contacts.both")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={clientTypeFilter}
              onValueChange={setClientTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("client.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("client.allTypes")}</SelectItem>
                <SelectItem value="individual">
                  {t("client.individual")}
                </SelectItem>
                <SelectItem value="merchant">{t("client.merchant")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => {
          const ClientIcon = getClientTypeIcon(contact.clientType);
          return (
            <Card
              key={contact.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ClientIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {contact.name}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getTypeColor(contact.type)}>
                          {getTypeLabel(contact.type)}
                        </Badge>
                        <Badge
                          className={getClientTypeColor(contact.clientType)}
                        >
                          {getClientTypeLabel(contact.clientType)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(contact)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div>
                      <p>{contact.address}</p>
                      <p>
                        {contact.city}, {contact.state}
                      </p>
                    </div>
                  </div>
                  {contact.clientType === "merchant" && contact.companyName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      {contact.companyName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("contacts.noContacts")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("contacts.noMatchingContacts")}
            </p>
            <Button onClick={handleAddContact}>
              <Plus className="w-4 h-4 mr-2" />
              {t("contacts.addContact")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
            <DialogDescription>
              {t("common.confirmDeleteContact")} "{contactToDelete?.name}"
              {t("common.cannotReverseAction")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle
              className={`${language === "ar" ? "text-right" : "text-left"}`}
            >
              {t("contacts.addContact")}
            </DialogTitle>
            <DialogDescription
              className={`${language === "ar" ? "text-right" : "text-left"}`}
            >
              {t("contacts.addContactDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  {t("sender.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("sender.enterName")}
                  className={`mt-2 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">
                  {t("sender.phone")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+963991234567"
                  className={`mt-2 ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">{t("sender.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@email.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="type">
                  {t("contacts.type")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type || "both"}
                  onValueChange={(value: "sender" | "receiver" | "both") =>
                    handleInputChange("type", value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sender">
                      {t("contacts.sender")}
                    </SelectItem>
                    <SelectItem value="receiver">
                      {t("contacts.receiver")}
                    </SelectItem>
                    <SelectItem value="both">{t("contacts.both")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="clientType">
                  {t("client.type")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.clientType || "individual"}
                  onValueChange={(value: "individual" | "merchant") =>
                    handleInputChange("clientType", value)
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
            </div>

            {/* Merchant Fields */}
            {formData.clientType === "merchant" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">
                    {t("auth.companyName")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    placeholder={t("form.enterCompanyName")}
                    className={`mt-2 ${
                      errors.companyName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="commercialRegister">
                    {t("auth.commercialRegister")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="commercialRegister"
                    value={formData.commercialRegister || ""}
                    onChange={(e) =>
                      handleInputChange("commercialRegister", e.target.value)
                    }
                    placeholder={t("form.enterCommercialRegister")}
                    className={`mt-2 ${
                      errors.commercialRegister ? "border-red-500" : ""
                    }`}
                  />
                  {errors.commercialRegister && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.commercialRegister}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">
                  {t("sender.country")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country || "سوريا"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: value,
                      state: "",
                      city: "",
                    }))
                  }
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.country ? "border-red-500" : ""}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state">
                  {t("sender.state")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.state || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, state: value, city: "" }))
                  }
                  disabled={!formData.country}
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.state ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder={t("common.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatesForCountry(formData.country || "").map(
                      (state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">
                  {t("sender.city")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.city || ""}
                  onValueChange={(value) => handleInputChange("city", value)}
                  disabled={!formData.state}
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.city ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder={t("common.selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getCitiesForState(
                      formData.country || "",
                      formData.state || ""
                    ).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">
                {t("sender.detailedAddress")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t("sender.enterDetailedAddress")}
                className={`mt-2 ${errors.address ? "border-red-500" : ""}`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveContact}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle
              className={`${language === "ar" ? "text-right" : "text-left"}`}
            >
              {t("contacts.editContact")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">
                  {t("sender.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("sender.enterName")}
                  className={`mt-2 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-phone">
                  {t("sender.phone")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+963991234567"
                  className={`mt-2 ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-email">{t("sender.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@email.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">
                  {t("contacts.type")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type || "both"}
                  onValueChange={(value: "sender" | "receiver" | "both") =>
                    handleInputChange("type", value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sender">
                      {t("contacts.sender")}
                    </SelectItem>
                    <SelectItem value="receiver">
                      {t("contacts.receiver")}
                    </SelectItem>
                    <SelectItem value="both">{t("contacts.both")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-clientType">
                  {t("client.type")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.clientType || "individual"}
                  onValueChange={(value: "individual" | "merchant") =>
                    handleInputChange("clientType", value)
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
            </div>

            {/* Merchant Fields */}
            {formData.clientType === "merchant" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-companyName">
                    {t("auth.companyName")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-companyName"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    placeholder={t("form.enterCompanyName")}
                    className={`mt-2 ${
                      errors.companyName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-commercialRegister">
                    {t("auth.commercialRegister")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-commercialRegister"
                    value={formData.commercialRegister || ""}
                    onChange={(e) =>
                      handleInputChange("commercialRegister", e.target.value)
                    }
                    placeholder={t("form.enterCommercialRegister")}
                    className={`mt-2 ${
                      errors.commercialRegister ? "border-red-500" : ""
                    }`}
                  />
                  {errors.commercialRegister && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.commercialRegister}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-country">
                  {t("sender.country")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country || "سوريا"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: value,
                      state: "",
                      city: "",
                    }))
                  }
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.country ? "border-red-500" : ""}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-state">
                  {t("sender.state")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.state || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, state: value, city: "" }))
                  }
                  disabled={!formData.country}
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.state ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder={t("common.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatesForCountry(formData.country || "").map(
                      (state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-city">
                  {t("sender.city")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.city || ""}
                  onValueChange={(value) => handleInputChange("city", value)}
                  disabled={!formData.state}
                >
                  <SelectTrigger
                    className={`mt-2 ${errors.city ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder={t("common.selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getCitiesForState(
                      formData.country || "",
                      formData.state || ""
                    ).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">
                {t("sender.detailedAddress")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t("sender.enterDetailedAddress")}
                className={`mt-2 ${errors.address ? "border-red-500" : ""}`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveContact}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
