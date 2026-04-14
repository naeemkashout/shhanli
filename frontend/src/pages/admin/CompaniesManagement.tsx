import React, { useEffect, useState } from "react";
import {
  Building2,
  Edit,
  KeyRound,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GlobalCountrySelector } from "@/components/GlobalCountrySelector";
import { SearchableStateSelector } from "@/components/SearchableStateSelector";
import {
  getAllCountries,
  getCountryByCode,
  getStateByCode,
  getStatesByCountry,
  GlobalCountry,
  GlobalState,
} from "@/data/globalLocations";

const emptyForm = {
  name: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  logoUrl: "",
  trackingUrlTemplate: "",
  supportedCountries: [] as string[],
  supportedLocalStates: [] as string[],
  supportsLocal: true,
  supportsInternational: true,
  localPerKgSYP: 0,
  internationalPerKgUSD: 0,
  volumetricDivisor: 6000,
  codEnabled: false,
  codLocalFeeSYP: 0,
  codInternationalFeeUSD: 0,
  isActive: true,
};

export default function CompaniesManagement() {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company-admin";
  const language = (localStorage.getItem("language") as "ar" | "en") || "ar";
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [accountCompany, setAccountCompany] = useState<any>(null);
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    resetPassword: false,
  });
  const [selectedInternationalCountry, setSelectedInternationalCountry] =
    useState("SY");
  const [selectedLocalState, setSelectedLocalState] = useState("DAM");
  const [includeAllCountries, setIncludeAllCountries] = useState(true);
  const [includeAllLocalStates, setIncludeAllLocalStates] = useState(true);

  const allCountries = getAllCountries();
  const syrianStates = getStatesByCountry("SY");

  const normalizeCountryCode = (value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "";

    if (/^[A-Za-z]{2}$/.test(normalized)) {
      return normalized.toUpperCase();
    }

    const lowered = normalized.toLowerCase();
    const matchedCountry = allCountries.find(
      (country) =>
        country.name.ar.toLowerCase() === lowered ||
        country.name.en.toLowerCase() === lowered,
    );

    return matchedCountry?.code || "";
  };

  const normalizeStateCode = (value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "";

    if (
      /^[A-Za-z0-9-]{2,10}$/.test(normalized) &&
      normalized === normalized.toUpperCase()
    ) {
      const exists = syrianStates.some((state) => state.code === normalized);
      if (exists) return normalized;
    }

    const lowered = normalized.toLowerCase();
    const matchedState = syrianStates.find(
      (state) =>
        state.name.ar.toLowerCase() === lowered ||
        state.name.en.toLowerCase() === lowered,
    );

    return matchedState?.code || "";
  };

  const addSupportedCountry = (country: GlobalCountry) => {
    setSelectedInternationalCountry(country.code);
    setFormData((prev) => {
      if (prev.supportedCountries.includes(country.code)) {
        return prev;
      }

      return {
        ...prev,
        supportedCountries: [...prev.supportedCountries, country.code],
      };
    });
  };

  const removeSupportedCountry = (countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedCountries: prev.supportedCountries.filter(
        (code) => code !== countryCode,
      ),
    }));
  };

  const addSupportedLocalState = (state: GlobalState) => {
    setSelectedLocalState(state.code);
    setFormData((prev) => {
      if (prev.supportedLocalStates.includes(state.code)) {
        return prev;
      }

      return {
        ...prev,
        supportedLocalStates: [...prev.supportedLocalStates, state.code],
      };
    });
  };

  const removeSupportedLocalState = (stateCode: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedLocalStates: prev.supportedLocalStates.filter(
        (code) => code !== stateCode,
      ),
    }));
  };

  useEffect(() => {
    fetchCompanies();
  }, [isCompanyAdmin]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);

      if (isCompanyAdmin) {
        const company = await adminService.getMyCompany();
        setCompanies(company ? [company] : []);
        return;
      }

      const response = await adminService.getAllCompanies({ limit: 50 });
      setCompanies(response.data);
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحميل شركات الشحن", "Failed to load shipping companies"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedCompany(null);
    setFormData(emptyForm);
    setSelectedInternationalCountry("SY");
    setSelectedLocalState("DAM");
    setIncludeAllCountries(true);
    setIncludeAllLocalStates(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    const normalizedSupportedCountries = (company.supportedCountries || [])
      .map((value: string) => normalizeCountryCode(value))
      .filter(Boolean);
    const normalizedSupportedLocalStates = (company.supportedLocalStates || [])
      .map((value: string) => normalizeStateCode(value))
      .filter(Boolean);

    setSelectedCompany(company);
    setFormData({
      name: company.name || "",
      code: company.code || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      description: company.description || "",
      logoUrl: company.logoUrl || "",
      trackingUrlTemplate: company.trackingUrlTemplate || "",
      supportedCountries: normalizedSupportedCountries,
      supportedLocalStates: normalizedSupportedLocalStates,
      supportsLocal: company.supportsLocal,
      supportsInternational: company.supportsInternational,
      localPerKgSYP: company.pricing?.localPerKgSYP || 0,
      internationalPerKgUSD: company.pricing?.internationalPerKgUSD || 0,
      volumetricDivisor: Number(company.volumetricDivisor) || 6000,
      codEnabled: company.codService?.enabled || false,
      codLocalFeeSYP: company.codService?.localFeeSYP || 0,
      codInternationalFeeUSD: company.codService?.internationalFeeUSD || 0,
      isActive: company.isActive,
    });
    setSelectedInternationalCountry("SY");
    setSelectedLocalState("DAM");
    setIncludeAllCountries(normalizedSupportedCountries.length === 0);
    setIncludeAllLocalStates(normalizedSupportedLocalStates.length === 0);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!includeAllCountries && formData.supportedCountries.length === 0) {
      toast.error(
        language === "ar"
          ? "يرجى اختيار دولة واحدة على الأقل أو تفعيل خيار جميع الدول"
          : "Select at least one country or enable all countries",
      );
      return;
    }

    if (!includeAllLocalStates && formData.supportedLocalStates.length === 0) {
      toast.error(
        language === "ar"
          ? "يرجى اختيار محافظة واحدة على الأقل أو تفعيل خيار جميع المحافظات"
          : "Select at least one state or enable all states",
      );
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      description: formData.description,
      logoUrl: formData.logoUrl,
      trackingUrlTemplate: formData.trackingUrlTemplate,
      supportedCountries: includeAllCountries
        ? []
        : formData.supportedCountries,
      supportedLocalStates: includeAllLocalStates
        ? []
        : formData.supportedLocalStates,
      supportsLocal: formData.supportsLocal,
      supportsInternational: formData.supportsInternational,
      pricing: {
        localPerKgSYP: Number(formData.localPerKgSYP),
        internationalPerKgUSD: Number(formData.internationalPerKgUSD),
      },
      volumetricDivisor: Number(formData.volumetricDivisor) || 6000,
      codService: {
        enabled: formData.codEnabled,
        localFeeSYP: Number(formData.codLocalFeeSYP),
        internationalFeeUSD: Number(formData.codInternationalFeeUSD),
      },
      isActive: formData.isActive,
    };

    try {
      if (isCompanyAdmin) {
        await adminService.updateMyCompany(payload);
        toast.success(
          tr(
            "تم تحديث إعدادات شركة الشحن بنجاح",
            "Shipping company settings updated successfully",
          ),
        );
      } else if (selectedCompany) {
        await adminService.updateCompany(selectedCompany._id, payload);
        toast.success(
          tr(
            "تم تحديث شركة الشحن بنجاح",
            "Shipping company updated successfully",
          ),
        );
      } else {
        await adminService.createCompany(payload);
        toast.success(
          tr(
            "تم إنشاء شركة الشحن بنجاح",
            "Shipping company created successfully",
          ),
        );
      }

      setIsDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حفظ شركة الشحن", "Failed to save shipping company"),
      );
    }
  };

  const handleToggleStatus = async (company: any) => {
    try {
      await adminService.updateCompany(company._id, {
        isActive: !company.isActive,
      });
      toast.success(
        company.isActive
          ? tr("تم إيقاف الشركة", "Company deactivated")
          : tr("تم تفعيل الشركة", "Company activated"),
      );
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل تحديث حالة الشركة", "Failed to update company status"),
      );
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        tr(
          "هل تريد حذف شركة الشحن نهائياً؟",
          "Do you want to permanently delete this shipping company?",
        ),
      )
    )
      return;

    try {
      await adminService.deleteCompany(companyId);
      toast.success(tr("تم حذف شركة الشحن", "Shipping company deleted"));
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حذف شركة الشحن", "Failed to delete shipping company"),
      );
    }
  };

  const openAccountDialog = (company: any) => {
    setAccountCompany(company);
    setAccountData({
      name: company.ownerUserId?.name || "",
      email: company.ownerUserId?.email || "",
      phone: company.ownerUserId?.phone || "",
      password: "",
      resetPassword: false,
    });
    setIsAccountDialogOpen(true);
  };

  const handleSaveCompanyAccount = async () => {
    if (!accountCompany) return;

    try {
      await adminService.upsertCompanyAdminAccount(accountCompany._id, {
        name: accountData.name,
        email: accountData.email,
        phone: accountData.phone,
        password: accountData.password || undefined,
        resetPassword: accountData.resetPassword,
      });

      toast.success(
        tr("تم حفظ حساب الشركة بنجاح", "Company account saved successfully"),
      );
      setIsAccountDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل حفظ حساب الشركة", "Failed to save company account"),
      );
    }
  };

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const uploadedLogoUrl = await adminService.uploadCompanyLogo(file);
      setFormData((prev) => ({ ...prev, logoUrl: uploadedLogoUrl }));
      toast.success(
        tr("تم رفع شعار الشركة بنجاح", "Company logo uploaded successfully"),
      );
    } catch (error: any) {
      toast.error(
        error.message ||
          tr("فشل رفع شعار الشركة", "Failed to upload company logo"),
      );
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">شركات الشحن</h1>
          <p className="mt-1 text-sm text-slate-500">
            إضافة وتعديل وتفعيل شركات الشحن وربطها بالنظام.
          </p>
        </div>
        {!isCompanyAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            إضافة شركة
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              جاري تحميل الشركات...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>الأسعار</TableHead>
                  <TableHead>المستخدمون</TableHead>
                  <TableHead>الشحنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-9 w-9 rounded-xl object-cover border"
                          />
                        ) : (
                          <div className="rounded-xl bg-slate-100 p-2">
                            <Building2 className="h-4 w-4 text-slate-700" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {company.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {company.email || company.phone || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {company.pricing?.localPerKgSYP || 0} ل.س / كغ
                        </div>
                        <div>
                          {company.pricing?.internationalPerKgUSD || 0} $ / كغ
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {company.codService?.enabled
                            ? `الدفع عند الاستلام: ${company.codService?.localFeeSYP || 0} ل.س | ${company.codService?.internationalFeeUSD || 0} $`
                            : "الدفع عند الاستلام غير مفعّل"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.usersCount || 0}</TableCell>
                    <TableCell>{company.shipmentsCount || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={company.isActive ? "default" : "secondary"}
                      >
                        {company.isActive ? "مفعلة" : "موقفة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!isCompanyAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAccountDialog(company)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isCompanyAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(company)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCompany(company._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "تعديل شركة الشحن" : "إضافة شركة شحن"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>اسم الشركة</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>الكود</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>العنوان</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>شعار الشركة (من الكمبيوتر)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                disabled={isUploadingLogo}
              />
              {isUploadingLogo && (
                <p className="mt-2 text-xs text-slate-500">
                  جاري رفع الشعار...
                </p>
              )}
              {formData.logoUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                  <img
                    src={formData.logoUrl}
                    alt="Company logo"
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <p className="text-xs text-slate-500 truncate">
                    تم اختيار شعار للشركة
                  </p>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>وصف الشركة</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="نبذة قصيرة عن الشركة والخدمات"
              />
            </div>
            <div className="md:col-span-2">
              <Label>رابط تتبع الشحنة</Label>
              <Input
                value={formData.trackingUrlTemplate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trackingUrlTemplate: e.target.value,
                  }))
                }
                placeholder="مثال: https://company.com/track/{trackingNumber}"
              />
              <p className="mt-1 text-xs text-slate-500">
                استخدم المتغير {`{trackingNumber}`} داخل الرابط ليتم استبداله
                برقم التتبع تلقائيًا.
              </p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <Label>الدول المدعومة دولياً (نفس اختيار إنشاء الشحنة)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAllCountries}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIncludeAllCountries(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        supportedCountries: [],
                      }));
                    }
                  }}
                />
                <Label>اختيار جميع الدول</Label>
              </div>
              <GlobalCountrySelector
                value={selectedInternationalCountry}
                onChange={addSupportedCountry}
                className="h-11"
                disabled={includeAllCountries}
              />
              <div className="flex flex-wrap gap-2">
                {includeAllCountries ? (
                  <span className="text-xs text-slate-500">
                    الشركة تدعم جميع الدول الدولية.
                  </span>
                ) : formData.supportedCountries.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    لم يتم اختيار أي دولة بعد.
                  </span>
                ) : (
                  formData.supportedCountries.map((countryCode) => {
                    const country = getCountryByCode(countryCode);
                    return (
                      <span
                        key={countryCode}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                      >
                        {country?.name.ar || countryCode}
                        <button
                          type="button"
                          onClick={() => removeSupportedCountry(countryCode)}
                          className="rounded-full p-0.5 hover:bg-blue-100"
                          aria-label="remove-country"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <Label>المحافظات السورية المدعومة للشحن المحلي</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAllLocalStates}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIncludeAllLocalStates(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        supportedLocalStates: [],
                      }));
                    }
                  }}
                />
                <Label>اختيار جميع المحافظات</Label>
              </div>
              <SearchableStateSelector
                countryCode="SY"
                value={selectedLocalState}
                onChange={addSupportedLocalState}
                className="h-11"
                disabled={includeAllLocalStates}
              />
              <div className="flex flex-wrap gap-2">
                {includeAllLocalStates ? (
                  <span className="text-xs text-slate-500">
                    الشركة تدعم جميع المحافظات السورية.
                  </span>
                ) : formData.supportedLocalStates.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    لم يتم اختيار أي محافظة بعد.
                  </span>
                ) : (
                  formData.supportedLocalStates.map((stateCode) => {
                    const state = getStateByCode("SY", stateCode);
                    return (
                      <span
                        key={stateCode}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                      >
                        {state?.name.ar || stateCode}
                        <button
                          type="button"
                          onClick={() => removeSupportedLocalState(stateCode)}
                          className="rounded-full p-0.5 hover:bg-emerald-100"
                          aria-label="remove-state"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <Label>سعر المحلي لكل كغ (ل.س)</Label>
              <Input
                type="number"
                value={formData.localPerKgSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    localPerKgSYP: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>سعر الدولي لكل كغ ($)</Label>
              <Input
                type="number"
                value={formData.internationalPerKgUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    internationalPerKgUSD: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>
                معامل القسمة للحجم (الطول × العرض × الارتفاع ÷ المعامل)
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.volumetricDivisor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    volumetricDivisor: Number(e.target.value) || 6000,
                  }))
                }
                placeholder="6000"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.codEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codEnabled: e.target.checked,
                  }))
                }
              />
              <Label>تفعيل خدمة الدفع عند الاستلام</Label>
            </div>
            <div>
              <Label>رسوم الدفع عند الاستلام المحلية (ل.س)</Label>
              <Input
                type="number"
                value={formData.codLocalFeeSYP}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codLocalFeeSYP: Number(e.target.value),
                  }))
                }
                disabled={!formData.codEnabled}
              />
            </div>
            <div>
              <Label>رسوم الدفع عند الاستلام الدولية ($)</Label>
              <Input
                type="number"
                value={formData.codInternationalFeeUSD}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codInternationalFeeUSD: Number(e.target.value),
                  }))
                }
                disabled={!formData.codEnabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.supportsLocal}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    supportsLocal: e.target.checked,
                  }))
                }
              />
              <Label>يدعم الشحن المحلي</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.supportsInternational}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    supportsInternational: e.target.checked,
                  }))
                }
              />
              <Label>يدعم الشحن الدولي</Label>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              <Label>الشركة مفعلة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حساب شركة الشحن</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              الشركة:{" "}
              <span className="font-semibold text-slate-900">
                {accountCompany?.name}
              </span>
            </div>
            <div>
              <Label>اسم صاحب الحساب</Label>
              <Input
                value={accountData.name}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={accountData.email}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={accountData.phone}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>كلمة مرور مؤقتة (اختياري عند التعديل)</Label>
              <Input
                type="password"
                value={accountData.password}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="اتركها فارغة إذا لا تريد تغيير كلمة المرور"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountData.resetPassword}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    resetPassword: e.target.checked,
                  }))
                }
              />
              <Label>إجبار تحديث كلمة المرور بهذه القيمة</Label>
            </div>
            <p className="text-xs text-slate-500">
              بعد تسليم الحساب، يمكن لمدير شركة الشحن تغيير كلمة المرور من صفحة
              تغيير كلمة المرور داخل لوحة التحكم.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccountDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveCompanyAccount}>حفظ الحساب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
