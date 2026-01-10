import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Mail, Phone, MapPin, Building, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import userService from "@/services/userService";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
    commercialRegistrationNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        companyName: user.companyName || "",
        commercialRegistrationNumber: user.commercialRegistrationNumber || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        companyName: profileData.companyName,
        commercialRegistrationNumber: profileData.commercialRegistrationNumber,
      });

      await refreshUser();
      toast.success("تم تحديث الملف الشخصي بنجاح");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث الملف الشخصي");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("تم تغيير كلمة المرور بنجاح");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || "فشل تغيير كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("profile.title")}
        </h1>

        {/* Profile Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("profile.personalInfo")}</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                {t("profile.edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setProfileData({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        address: user.address || "",
                        companyName: user.companyName || "",
                        commercialRegistrationNumber:
                          user.commercialRegistrationNumber || "",
                      });
                    }
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  {t("profile.cancel")}
                </Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "جاري الحفظ..." : t("profile.save")}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="w-4 h-4 inline ml-2" />
                  {t("profile.name")}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline ml-2" />
                  {t("profile.email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline ml-2" />
                  {t("profile.phone")}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="w-4 h-4 inline ml-2" />
                  {t("profile.address")}
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </div>

              {user?.businessType === "merchant" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      <Building className="w-4 h-4 inline ml-2" />
                      {t("profile.companyName")}
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={profileData.companyName}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commercialRegistrationNumber">
                      <Building className="w-4 h-4 inline ml-2" />
                      {t("profile.commercialRegistration")}
                    </Label>
                    <Input
                      id="commercialRegistrationNumber"
                      name="commercialRegistrationNumber"
                      value={profileData.commercialRegistrationNumber}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              <Lock className="w-5 h-5 inline ml-2" />
              {t("profile.changePassword")}
            </CardTitle>
            {!isChangingPassword && (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
              >
                {t("profile.change")}
              </Button>
            )}
          </CardHeader>
          {isChangingPassword && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("profile.currentPassword")}
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("profile.confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  {t("profile.cancel")}
                </Button>
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? "جاري التغيير..." : t("profile.save")}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.accountInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t("profile.accountType")}</span>
              <span className="font-medium">
                {user?.businessType === "merchant" ? "تاجر" : "فرد"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t("profile.memberSince")}</span>
              {/* <span className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ar-SY")
                  : "غير متوفر"}
              </span> */}
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">الحالة</span>
              {/* <span className="font-medium text-green-600">
                {user?.isActive ? "نشط" : "غير نشط"}
              </span> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
