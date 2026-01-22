import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function ResetPassword() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { resetPassword } = useAuth();
  const operationStatus = useOperationStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (resetToken) {
      setToken(resetToken);
      // Here you could validate the token with the backend
      // For now, we'll assume it's valid if present
    } else {
      setIsValidToken(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("يرجى إدخال كلمة المرور وتأكيدها");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون على الأقل 6 أحرف");
      return;
    }

    await operationStatus.executeOperation(async () => {
      await resetPassword({ token, newPassword: formData.password });
    });
  };

  const handleOperationSuccess = () => {
    operationStatus.reset();
    setIsPasswordReset(true);
    toast.success("تم إعادة تعيين كلمة المرور بنجاح");

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate("/signin");
    }, 3000);
  };

  const handleOperationRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isValidToken) {
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
            <h1 className="text-2xl font-bold text-gray-900">شحنلي</h1>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                رابط غير صالح
              </h2>
              <p className="text-gray-600 mb-4">
                رابط إعادة تعيين كلمة المرور هذا غير صالح أو منتهي الصلاحية.
              </p>
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full"
              >
                طلب رابط جديد
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isPasswordReset) {
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
            <h1 className="text-2xl font-bold text-gray-900">شحنلي</h1>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                تم إعادة التعيين بنجاح!
              </h2>
              <p className="text-gray-600 mb-4">
                تم إعادة تعيين كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل
                الدخول...
              </p>
              <Button onClick={() => navigate("/signin")} className="w-full">
                تسجيل الدخول الآن
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">شحنلي</h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>أدخل كلمة المرور الجديدة لحسابك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
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
                  ? "جاري إعادة التعيين..."
                  : "إعادة تعيين كلمة المرور"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">تذكرت كلمة المرور؟</p>
              <Button
                variant="outline"
                onClick={() => navigate("/signin")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operation Status Overlay */}
      <OperationStatus
        state={operationStatus.state}
        title="إعادة تعيين كلمة المرور"
        loadingMessage="جاري إعادة تعيين كلمة المرور..."
        successMessage="تم إعادة تعيين كلمة المرور بنجاح"
        errorMessage="فشل في إعادة تعيين كلمة المرور"
        onRetry={handleOperationRetry}
        onContinue={handleOperationSuccess}
        onClose={() => operationStatus.reset()}
      />
    </div>
  );
}
