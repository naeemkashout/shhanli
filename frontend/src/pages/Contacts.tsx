import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { GlobalCountrySelector } from "@/components/GlobalCountrySelector";
import { SearchableStateSelector } from "@/components/SearchableStateSelector";
import contactService, { CreateContactData } from "@/services/contactService";

interface Contact {
  id?: string;
  _id?: string;
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

const PHONE_REGEX = /^\+?\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhoneInput = (value: string) => {
  // Keep digits and a single optional leading plus.
  const cleaned = value.replace(/[^\d+]/g, "");
  const withoutExtraPlus = cleaned.replace(/(?!^)\+/g, "");
  return withoutExtraPlus;
};

export default function Contacts() {
  const { t, isRTL } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateContactData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    street: "",
    country: "SY",
    state: "",
    city: "",
    clientType: "individual",
    type: "both",
    companyName: "",
    commercialRegister: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await contactService.getUserContacts();
      setContacts(response.data || []);
    } catch (error: any) {
      console.error("Error loading contacts:", error);
      toast.error(
        error?.message ||
          (language === "ar"
            ? "فشل في تحميل جهات الاتصال"
            : "Failed to load contacts"),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    const matchesClientType =
      clientTypeFilter === "all" || contact.clientType === clientTypeFilter;

    return matchesSearch && matchesType && matchesClientType;
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phone = normalizePhoneInput(formData.phone || "").trim();
    const email = String(formData.email || "").trim();

    if (!formData.name?.trim()) {
      newErrors.name = t("validation.firstNameRequired");
    }
    if (!phone) {
      newErrors.phone = t("validation.phoneRequired");
    } else if (!PHONE_REGEX.test(phone)) {
      newErrors.phone =
        language === "ar"
          ? "رقم الهاتف يجب أن يحتوي أرقاما فقط (مع + اختياري في البداية)"
          : "Phone number must contain digits only (optional leading +)";
    }
    if (email && !EMAIL_REGEX.test(email)) {
      newErrors.email =
        language === "ar"
          ? "صيغة البريد الإلكتروني غير صحيحة"
          : "Invalid email format";
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
    if (!formData.city?.trim()) {
      newErrors.city = t("validation.cityRequired");
    }

    // Merchant specific validation
    if (formData.clientType === "merchant") {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = t("validation.companyNameRequired");
      }
      if (!formData.commercialRegister?.trim()) {
        newErrors.commercialRegister = t(
          "validation.commercialRegisterRequired",
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
      country: "SY",
      state: "",
      city: "",
      clientType: "individual",
      type: "both",
      companyName: "",
      commercialRegister: "",
    });
    setErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      address: contact.address || "",
      street: contact.street,
      country: contact.country,
      state: contact.state,
      city: contact.city,
      clientType: contact.clientType,
      type: contact.type,
      companyName: contact.companyName || "",
      commercialRegister: contact.commercialRegister || "",
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      setIsSubmitting(true);
      await contactService.deleteContact(
        contactToDelete.id || contactToDelete._id,
      );
      await loadContacts();
      toast.success(t("contacts.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error(
        error?.message ||
          (language === "ar"
            ? "فشل في حذف جهة الاتصال"
            : "Failed to delete contact"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContact = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateContactData = {
        ...formData,
        phone: normalizePhoneInput(formData.phone || "").trim(),
        email: (formData.email || "").trim(),
        address: (formData.address || formData.street || "").trim(),
        street: (formData.street || formData.address || "").trim(),
      };

      if (selectedContact) {
        // Edit existing contact
        await contactService.updateContact(
          selectedContact.id || selectedContact._id,
          payload,
        );
        toast.success(t("contacts.updateSuccess"));
        setIsEditDialogOpen(false);
      } else {
        // Add new contact
        await contactService.createContact(payload);
        toast.success(t("contacts.addSuccess"));
        setIsAddDialogOpen(false);
      }

      await loadContacts();
      setSelectedContact(null);
      setErrors({});
    } catch (error: any) {
      console.error("Error saving contact:", error);
      if (error.message?.includes("Phone number already exists")) {
        toast.error(
          language === "ar"
            ? "رقم الهاتف موجود بالفعل"
            : "Phone number already exists",
        );
      } else {
        toast.error(
          error?.message ||
            (language === "ar"
              ? "فشل في حفظ جهة الاتصال"
              : "Failed to save contact"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const { language } = useLanguage();
  const handleInputChange = (field: keyof Contact, value: string) => {
    const nextValue =
      field === "phone"
        ? normalizePhoneInput(value)
        : field === "email"
          ? value.trimStart()
          : value;

    setFormData((prev) => ({ ...prev, [field]: nextValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "phone" && errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
    if (field === "email" && errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("contacts.title")}
        </h1>
        <Button onClick={handleAddContact} className="w-full sm:w-auto">
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
              key={contact._id || contact.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ClientIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 break-words">
                        {contact.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
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
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                      className="min-h-[40px] min-w-[40px]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(contact)}
                      className="text-red-600 hover:text-red-700 min-h-[40px] min-w-[40px]"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
            <DialogDescription>
              {t("common.confirmDeleteContact")} "{contactToDelete?.name}"
              {t("common.cannotReverseAction")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto"
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  inputMode="tel"
                  dir="ltr"
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
                  className={`mt-2 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
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
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.country")} <span className="text-red-500">*</span>
                </Label>
                <GlobalCountrySelector
                  value={formData.country || ""}
                  onChange={(country) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: country.code,
                      state: "",
                      city: "",
                    }))
                  }
                  className={`mt-2 ${errors.country ? "border-red-500" : ""}`}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.state")} <span className="text-red-500">*</span>
                </Label>
                <SearchableStateSelector
                  countryCode={formData.country || ""}
                  value={formData.state || ""}
                  onChange={(province) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: province.code,
                      city: "",
                    }))
                  }
                  className={`mt-2 ${errors.state ? "border-red-500" : ""}`}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.city")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder={t("form.enterCity")}
                  className={`mt-2 ${errors.city ? "border-red-500" : ""}`}
                />
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
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveContact} className="w-full sm:w-auto">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  inputMode="tel"
                  dir="ltr"
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
                  className={`mt-2 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
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
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.country")} <span className="text-red-500">*</span>
                </Label>
                <GlobalCountrySelector
                  value={formData.country || ""}
                  onChange={(country) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: country.code,
                      state: "",
                      city: "",
                    }))
                  }
                  className={`mt-2 ${errors.country ? "border-red-500" : ""}`}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.state")} <span className="text-red-500">*</span>
                </Label>
                <SearchableStateSelector
                  countryCode={formData.country || ""}
                  value={formData.state || ""}
                  onChange={(province) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: province.code,
                      city: "",
                    }))
                  }
                  className={`mt-2 ${errors.state ? "border-red-500" : ""}`}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("sender.city")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder={t("form.enterCity")}
                  className={`mt-2 ${errors.city ? "border-red-500" : ""}`}
                />
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
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveContact} className="w-full sm:w-auto">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
