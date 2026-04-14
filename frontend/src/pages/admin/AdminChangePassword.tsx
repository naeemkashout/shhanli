import React, { useState } from "react";
import { Shield, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminChangePassword() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const { user, updatePassword, isLoading } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const isPlatformOwner = ["admin", "super-admin"].includes(user?.role || "");

  const validateForm = () => {
    const nextErrors = {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    };

    let valid = true;

    if (!passwordData.currentPassword) {
      nextErrors.currentPassword = tr(
        "يرجى إدخال كلمة المرور الحالية",
        "Please enter current password",
      );
      valid = false;
    }

    if (!passwordData.newPassword) {
      nextErrors.newPassword = tr(
        "يرجى إدخال كلمة المرور الجديدة",
        "Please enter new password",
      );
      valid = false;
    } else if (passwordData.newPassword.length < 8) {
      nextErrors.newPassword = tr(
        "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
        "New password must be at least 8 characters",
      );
      valid = false;
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      nextErrors.newPassword = tr(
        "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية",
        "New password must be different from current password",
      );
      valid = false;
    }

    if (!passwordData.confirmNewPassword) {
      nextErrors.confirmNewPassword = tr(
        "يرجى تأكيد كلمة المرور الجديدة",
        "Please confirm new password",
      );
      valid = false;
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      nextErrors.confirmNewPassword = tr(
        "تأكيد كلمة المرور غير مطابق",
        "Password confirmation does not match",
      );
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const success = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      if (success) {
        toast.success(
          tr("تم تحديث كلمة المرور بنجاح", "Password updated successfully"),
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setErrors({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          tr("فشل تحديث كلمة المرور", "Failed to update password"),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {tr("تغيير كلمة المرور", "Change Password")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isPlatformOwner
            ? tr(
                "حساب مالك المنصة - تأمين كامل المنصة",
                "Platform owner account - secure the whole platform",
              )
            : tr(
                "حساب شركة الشحن - تأمين بيانات الشركة",
                "Shipping company account - secure company data",
              )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isPlatformOwner
              ? tr("حماية حساب مالك المنصة", "Protect platform owner account")
              : tr(
                  "حماية حساب مدير شركة الشحن",
                  "Protect shipping company manager account",
                )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{tr("كلمة المرور الحالية", "Current Password")}</Label>
            <Input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              className={errors.currentPassword ? "border-red-500" : ""}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              className={errors.newPassword ? "border-red-500" : ""}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <Label>تأكيد كلمة المرور الجديدة</Label>
            <Input
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmNewPassword: e.target.value,
                }))
              }
              className={errors.confirmNewPassword ? "border-red-500" : ""}
            />
            {errors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmNewPassword}
              </p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <KeyRound className="mr-2 h-4 w-4" />
            تحديث كلمة المرور
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
