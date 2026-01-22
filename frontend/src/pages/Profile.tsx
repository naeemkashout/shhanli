import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Settings,
  Globe,
  Save,
  LogOut,
  Building,
  Crown,
  CheckCircle,
  UserCheck,
  Briefcase,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import userService from "@/services/userService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout, updatePassword, isLoading, refreshUser } = useAuth();
  // const { user, logout } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    accountType: "individual" as "individual" | "merchant",
    company: "",
    commercialRegister: "",
    bio: "",
    address: "",
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    shipmentUpdates: true,
    promotions: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
  });
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Fetch fresh profile data when component mounts
  React.useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        setIsProfileLoading(true);
        try {
          // Fetch fresh data from server to ensure we have the correct user's data
          const profileResponse = await userService.getProfile();
          setProfileData({
            name: profileResponse.name || "",
            email: profileResponse.email || "",
            phone: profileResponse.phone || "",
            accountType:
              (profileResponse.businessType as "individual" | "merchant") ||
              "individual",
            company: profileResponse.companyName || "",
            commercialRegister:
              profileResponse.commercialRegistrationNumber || "",
            bio: "",
            address: profileResponse.address || "",
          });
        } catch (error) {
          console.error("Failed to fetch profile data:", error);
          // Fallback to AuthContext data if server fetch fails
          setProfileData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            accountType:
              (user.businessType as "individual" | "merchant") || "individual",
            company: user.companyName || "",
            commercialRegister: user.commercialRegistrationNumber || "",
            bio: "",
            address: user.address || "",
          });
        } finally {
          setIsProfileLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        businessType: profileData.accountType,
        companyName: profileData.company,
        commercialRegistrationNumber: profileData.commercialRegister,
      };

      const result = await userService.updateProfile(updateData);

      if (result.success) {
        // Refresh user data in AuthContext to update the UI immediately
        await refreshUser();
        toast.success(
          language === "ar"
            ? "تم حفظ التغييرات بنجاح"
            : "Changes saved successfully",
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        language === "ar"
          ? "حدث خطأ أثناء حفظ التغييرات"
          : "Error saving changes",
      );
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as "ar" | "en");
    toast.success(t("profile.languageChanged"));
  };
  const validatePasswordForm = (): boolean => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    };

    let isValid = true;

    // Validate current password
    if (!passwordData.currentPassword) {
      errors.currentPassword =
        language === "ar"
          ? "يرجى إدخال كلمة المرور الحالية"
          : "Please enter current password";
      isValid = false;
    }

    // Validate new password
    if (!passwordData.newPassword) {
      errors.newPassword =
        language === "ar"
          ? "يرجى إدخال كلمة المرور الجديدة"
          : "Please enter new password";
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword =
        language === "ar"
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل"
          : "Password must be at least 8 characters";
      isValid = false;
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword =
        language === "ar"
          ? "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية"
          : "New password must be different from current password";
      isValid = false;
    }

    // Validate confirm password
    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword =
        language === "ar"
          ? "يرجى تأكيد كلمة المرور الجديدة"
          : "Please confirm new password";
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword =
        language === "ar"
          ? "كلمات المرور غير متطابقة"
          : "Passwords do not match";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handleUpdatePassword = async () => {
    // Clear previous errors
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    // Validate form
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const success = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      if (success) {
        toast.success(
          language === "ar"
            ? "تم تحديث كلمة المرور بنجاح"
            : "Password updated successfully",
        );

        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        toast.error(
          language === "ar"
            ? "كلمة المرور الحالية غير صحيحة"
            : "Current password is incorrect",
        );
      }
    } catch (error) {
      toast.error(
        language === "ar"
          ? "حدث خطأ أثناء تحديث كلمة المرور"
          : "An error occurred while updating password",
      );
    }
  };
  const handleLogout = () => {
    logout();
    toast.success(t("auth.logoutSuccess"));
    navigate("/signin");
  };

  const handleAccountTypeChange = (newType: string) => {
    setProfileData((prev) => ({
      ...prev,
      accountType: newType as "individual" | "merchant",
    }));
    toast.success(t("profile.accountTypeChanged"));
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("profile.title")}
        </h1>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t("nav.logout")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Profile Overview */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <div
                className={`w-24 h-24 ${
                  profileData.accountType === "merchant"
                    ? "bg-gradient-to-br from-purple-600 to-purple-700"
                    : "bg-gradient-to-br from-blue-600 to-blue-700"
                } rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
              >
                {profileData.accountType === "merchant" ? (
                  <Building className="w-12 h-12 text-white" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {profileData.name}
              </h3>
              <p className="text-gray-600">{profileData.email}</p>

              {/* Enhanced Account Type Display */}
              <div className="flex flex-col items-center gap-3 mt-4">
                {profileData.accountType === "merchant" ? (
                  <div className="flex flex-col items-center">
                    <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 px-4 py-2 text-sm font-medium shadow-md">
                      <Crown className="w-4 h-4 mr-2" />
                      {t("auth.merchant")}
                    </Badge>
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 w-full">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">
                          {t("company.name")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-purple-900 text-center">
                        {profileData.company}
                      </p>
                      <p className="text-xs text-purple-600 text-center mt-1">
                        {t("auth.commercialRegister")}:{" "}
                        {profileData.commercialRegister ||
                          (language === "ar" ? "غير محدد" : "Not specified")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 px-4 py-2 text-sm font-medium shadow-md">
                      <UserCheck className="w-4 h-4 mr-2" />
                      {t("auth.individual")}
                    </Badge>
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 w-full">
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          {language === "ar" ? "حساب شخصي" : "Personal Account"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {language === "ar" ? "موثق" : "Verified"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                {t("profile.memberSince")}{" "}
                {language === "ar" ? "يناير 2024" : "January 2024"}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
              </h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {profileData.phone}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 block">
                      {language === "ar" ? "العنوان" : "Address"}
                    </span>
                    <span className="text-sm text-gray-600 leading-relaxed">
                      {profileData.address ||
                        (language === "ar"
                          ? "لم يتم تحديد العنوان"
                          : "Address not specified")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("profile.personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Account Type Selection */}
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-gray-900 mb-3 block">
                    {t("auth.accountType")}
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    {language === "ar"
                      ? "اختر نوع الحساب المناسب لاستخدامك"
                      : "Choose the account type that suits your usage"}
                  </p>
                </div>

                <RadioGroup
                  value={profileData.accountType}
                  onValueChange={handleAccountTypeChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Individual Account Option */}
                  <div
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      profileData.accountType === "individual"
                        ? "border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-25"
                    }`}
                  >
                    <RadioGroupItem
                      value="individual"
                      id="individual"
                      className={`absolute ${
                        isRTL ? "left-4" : "right-4"
                      } top-4`}
                    />
                    <Label
                      htmlFor="individual"
                      className="cursor-pointer block"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                            profileData.accountType === "individual"
                              ? "bg-green-600 shadow-lg"
                              : "bg-gray-400"
                          }`}
                        >
                          <UserCheck className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {t("auth.individual")}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {language === "ar"
                              ? "مناسب للأفراد والاستخدام الشخصي. سهل الإعداد وبداية سريعة."
                              : "Perfect for individuals and personal use. Easy setup and quick start."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            {language === "ar" ? "إعداد سهل" : "Easy Setup"}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            {language === "ar" ? "بداية سريعة" : "Quick Start"}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Merchant Account Option */}
                  <div
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      profileData.accountType === "merchant"
                        ? "border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                    }`}
                  >
                    <RadioGroupItem
                      value="merchant"
                      id="merchant"
                      className={`absolute ${
                        isRTL ? "left-4" : "right-4"
                      } top-4`}
                    />
                    <Label htmlFor="merchant" className="cursor-pointer block">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                            profileData.accountType === "merchant"
                              ? "bg-purple-600 shadow-lg"
                              : "bg-gray-400"
                          }`}
                        >
                          <Building className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {t("auth.merchant")}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {language === "ar"
                              ? "مخصص للشركات والتجار. مميزات تجارية متقدمة وشحن بالجملة."
                              : "Designed for companies and merchants. Advanced business features and bulk shipping."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            {language === "ar"
                              ? "مميزات تجارية"
                              : "Business Features"}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            {language === "ar"
                              ? "شحن بالجملة"
                              : "Bulk Shipping"}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    {t("profile.fullName")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    {t("sender.email")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    {t("sender.phone")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Merchant-Specific Fields with Animation */}
              {profileData.accountType === "merchant" && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <Separator />

                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      {language === "ar"
                        ? "معلومات الشركة"
                        : "Company Information"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="company"
                        className="flex items-center gap-2"
                      >
                        <Building className="w-4 h-4 text-purple-600" />
                        {t("auth.companyName")}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            company: e.target.value,
                          }))
                        }
                        placeholder={t("form.enterCompanyName")}
                        className="mt-2 border-purple-200 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="commercialRegister"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        {t("auth.commercialRegister")}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="commercialRegister"
                        value={profileData.commercialRegister}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            commercialRegister: e.target.value,
                          }))
                        }
                        placeholder={
                          language === "ar"
                            ? "أدخل رقم السجل التجاري"
                            : "Enter commercial registration number"
                        }
                        className="mt-2 border-purple-200 focus:border-purple-500"
                      />
                    </div>

                    {/* <div className="md:col-span-2">
                      <Label
                        htmlFor="website"
                        className="flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4 text-purple-600" />
                        {t("profile.website")}
                        <span className="text-gray-500 text-sm">
                          ({t("common.optional")})
                        </span>
                      </Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        placeholder="www.example.com"
                        className="mt-2 border-purple-200 focus:border-purple-500"
                      />
                    </div> */}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="bio">{t("profile.bio")}</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">{t("sender.address")}</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {t("profile.saveChanges")}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t("profile.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.emailNotifications")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.emailNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.smsNotifications")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.smsNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        smsNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.pushNotifications")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.pushNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        pushNotifications: checked,
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.shipmentUpdates")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.shipmentUpdatesDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.shipmentUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        shipmentUpdates: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.promotions")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.promotionsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.promotions}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        promotions: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t("profile.security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.twoFactorAuth")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.twoFactorAuthDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSecurity((prev) => ({
                        ...prev,
                        twoFactorAuth: checked,
                      }))
                    }
                  />
                </div> */}

                {/* <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("profile.loginAlerts")}</Label>
                    <p className="text-sm text-gray-600">
                      {t("profile.loginAlertsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={security.loginAlerts}
                    onCheckedChange={(checked) =>
                      setSecurity((prev) => ({ ...prev, loginAlerts: checked }))
                    }
                  />
                </div> */}

                {/* <div>
                  <Label>{t("profile.sessionTimeout")}</Label>
                  <Select
                    value={security.sessionTimeout}
                    onValueChange={(value) =>
                      setSecurity((prev) => ({
                        ...prev,
                        sessionTimeout: value,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">
                        {t("profile.timeout15")}
                      </SelectItem>
                      <SelectItem value="30">
                        {t("profile.timeout30")}
                      </SelectItem>
                      <SelectItem value="60">
                        {t("profile.timeout60")}
                      </SelectItem>
                      <SelectItem value="120">
                        {t("profile.timeout120")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                <Separator />

                <div>
                  <Label>{t("profile.changePassword")}</Label>
                  <div className="grid grid-cols-1 gap-4 mt-2">
                    <div>
                      <Input
                        type="password"
                        placeholder={t("profile.currentPassword")}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className={
                          passwordErrors.currentPassword ? "border-red-500" : ""
                        }
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        type="password"
                        placeholder={t("profile.newPassword")}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className={
                          passwordErrors.newPassword ? "border-red-500" : ""
                        }
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        type="password"
                        placeholder={t("profile.confirmNewPassword")}
                        value={passwordData.confirmNewPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            confirmNewPassword: e.target.value,
                          }))
                        }
                        className={
                          passwordErrors.confirmNewPassword
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {passwordErrors.confirmNewPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordErrors.confirmNewPassword}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-fit"
                      onClick={handleUpdatePassword}
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {t("profile.updatePassword")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          {/* <Card> */}
          {/* <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
          {/* <div>
                  <Label>{t("profile.currency")}</Label>
                  <Select defaultValue="USD">
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
                </div> */}
          {/* </div>

              <Separator /> */}

          {/* <div className="space-y-4">
                <h4 className="font-medium text-red-600">
                  {t("profile.dangerZone")}
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="destructive">
                    {t("profile.deleteAccount")}
                  </Button>
                </div>
              </div> */}
          {/* </CardContent> */}
          {/* </Card> */}
        </div>
      </div>
    </div>
  );
}
