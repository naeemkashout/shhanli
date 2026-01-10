import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Mail, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import OperationStatus from "@/components/OperationStatus";
import { useOperationStatus } from "@/hooks/useOperationStatus";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const operationStatus = useOperationStatus();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const simulateLogin = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random success/failure (90% success rate)
    if (Math.random() > 0.1) {
      await login(email, password);
    } else {
      throw new Error(t("auth.loginError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await operationStatus.executeOperation(async () => {
      await simulateLogin(formData.email, formData.password);
    });
  };

  const handleOperationSuccess = () => {
    operationStatus.reset();
    toast.success(t("auth.loginSuccess"));
    navigate("/dashboard");
  };

  const handleOperationRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex items-center gap-2 min-h-[44px] px-3"
          >
            <Globe className="w-4 h-4" />
            {language === "ar" ? "EN" : "ع"}
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {/* {t("app.name")} */}
              شحنلي
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t("auth.signIn")}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm sm:text-base"
                >
                  <Mail className="w-4 h-4" />
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={t("auth.email")}
                  required
                  className="h-11 sm:h-12 text-base px-3 sm:px-4"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm sm:text-base"
                >
                  <Lock className="w-4 h-4" />
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  // type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder={t("auth.password")}
                  required
                  className="h-11 sm:h-12 text-base px-3 sm:px-4"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      handleInputChange("rememberMe", checked as boolean)
                    }
                    className="min-h-[20px] min-w-[20px]"
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    {t("auth.rememberMe")}
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline min-h-[44px] flex items-center"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <Button
                type="submit"
                className="w-full h-12 sm:h-13 text-base font-medium"
                disabled={operationStatus.isLoading}
              >
                {operationStatus.isLoading
                  ? t("common.loading")
                  : t("auth.signIn")}
              </Button>

              <div className="text-center text-sm text-gray-600">
                {t("auth.noAccount")}{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium min-h-[44px] inline-flex items-center"
                >
                  {t("auth.signUp")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Operation Status Overlay */}
      <OperationStatus
        state={operationStatus.state}
        title={t("auth.signIn")}
        loadingMessage={t("auth.signingIn")}
        successMessage={t("auth.loginSuccess")}
        errorMessage={t("auth.loginError")}
        onRetry={handleOperationRetry}
        onContinue={handleOperationSuccess}
        onClose={() => operationStatus.reset()}
      />
    </div>
  );
}
