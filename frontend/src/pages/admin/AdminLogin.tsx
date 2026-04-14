import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import authService from "@/services/authService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminLogin() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login(formData);

      // Check if user is admin
      if (!["admin", "super-admin"].includes(response.data.user.role)) {
        setError(
          tr(
            "تم رفض الوصول. صلاحيات الأدمن مطلوبة.",
            "Access denied. Admin privileges required.",
          ),
        );
        await authService.logout();
        return;
      }

      toast.success(tr("تسجيل دخول ناجح", "Login successful"));
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || tr("فشل تسجيل الدخول", "Login failed"));
      toast.error(err.message || tr("فشل تسجيل الدخول", "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">
            {tr("لوحة التحكم الإدارية", "Admin Dashboard")}
          </CardTitle>
          <p className="text-gray-600">
            {tr("تسجيل دخول لوحة التحكم", "Admin Dashboard Login")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{tr("البريد الإلكتروني", "Email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@kashout.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{tr("كلمة المرور", "Password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading
                ? tr("جاري تسجيل الدخول...", "Signing in...")
                : tr("تسجيل الدخول", "Sign In")}
            </Button>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-1">
                بيانات الدخول الافتراضية:
              </p>
              <p className="text-blue-700">Email: admin@kashout.com</p>
              <p className="text-blue-700">Password: Admin@123456</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
