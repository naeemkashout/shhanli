import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  ArrowLeft,
  Globe,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import OperationStatus from "@/components/OperationStatus";
import { useOperationStatus } from "@/hooks/useOperationStatus";

export default function ForgotPassword() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { forgotPassword } = useAuth();
  const operationStatus = useOperationStatus();

  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t("auth.enterEmail"));
      return;
    }

    operationStatus.setLoading();

    try {
      const result = await forgotPassword({ email });
      if (result.success && result.previewUrl) {
        setPreviewUrl(result.previewUrl);
      } else {
        setPreviewUrl("");
      }

      if (!result.success) {
        throw new Error(t("auth.linkSendFailed"));
      }

      operationStatus.setSuccess();
    } catch (error: any) {
      operationStatus.setError(error?.message || t("auth.linkSendFailed"));
    }
  };

  const handleOperationSuccess = () => {
    operationStatus.reset();
    setIsEmailSent(true);
    toast.success(t("auth.resetLinkSent"));
  };

  const handleOperationRetry = async () => {
    if (!email.trim()) {
      toast.error(t("auth.enterEmail"));
      operationStatus.setError(t("auth.enterEmail"));
      return;
    }

    operationStatus.setLoading();

    try {
      const result = await forgotPassword({ email });
      if (result.success && result.previewUrl) {
        setPreviewUrl(result.previewUrl);
      } else {
        setPreviewUrl("");
      }

      if (!result.success) {
        throw new Error(t("auth.linkSendFailed"));
      }

      operationStatus.setSuccess();
    } catch (error: any) {
      operationStatus.setError(error?.message || t("auth.linkSendFailed"));
    }
  };

  const handleSendAgain = () => {
    setIsEmailSent(false);
    setEmail("");
    setPreviewUrl("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === "ar" ? "EN" : "ع"}
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
          {/* <h1 className="text-2xl font-bold text-gray-900">{t("app.name")}</h1> */}
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "ar" ? "شحنلي" : "Shipme"}
          </h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {isEmailSent ? t("auth.linkSent") : t("auth.forgotPassword")}
            </CardTitle>
            <CardDescription>
              {isEmailSent
                ? t("auth.checkEmailInstructions")
                : t("auth.enterEmailForReset")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isEmailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={operationStatus.isLoading}
                >
                  {operationStatus.isLoading
                    ? t("auth.sending")
                    : t("auth.sendResetLink")}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600">{t("auth.resetLinkSentTo")}</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {email}
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    {t("auth.didntReceiveEmail")}
                  </p>
                  {previewUrl && (
                    <Button
                      onClick={() => window.open(previewUrl, "_blank")}
                      variant="secondary"
                      className="w-full"
                    >
                      {isRTL
                        ? "فتح رابط الرسالة التجريبية"
                        : "Open preview email link"}
                    </Button>
                  )}
                  <Button
                    onClick={handleSendAgain}
                    variant="outline"
                    className="w-full"
                  >
                    {t("auth.sendAgain")}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/signin"
                className="text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center gap-2 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.backToLogin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operation Status Overlay */}
      <OperationStatus
        state={operationStatus.state}
        title={t("auth.resetPassword")}
        loadingMessage={t("auth.sendingResetLink")}
        successMessage={t("auth.linkSentSuccess")}
        errorMessage={operationStatus.errorMessage || t("auth.linkSendFailed")}
        onRetry={handleOperationRetry}
        onContinue={handleOperationSuccess}
        onClose={() => operationStatus.reset()}
      />
    </div>
  );
}
