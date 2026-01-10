import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft, Upload, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function SignUp() {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "",
    companyName: "",
    commercialRegister: "",
    country: "",
    province: "",
    city: "",
    street: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      toast.error(
        "Some files were rejected. Please ensure files are PDF, JPG, PNG, DOC, or DOCX and under 5MB."
      );
    }

    setUploadedFiles((prev) => [...prev, ...validFiles]);
    toast.success(t("msg.filesUploaded", { count: validFiles.length }));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
      toast.error(t("msg.fillRequired"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t("validation.passwordMismatch"));
      return;
    }

    if (formData.accountType === "merchant" && !formData.companyName) {
      toast.error(t("msg.fillCompanyInfo"));
      return;
    }
    if (formData.accountType === "merchant" && !formData.commercialRegister) {
      toast.error(t("msg.fillCompanyInfo"));
      return;
    }

    if (!formData.city) {
      toast.error(t("validation.cityRequired"));
      return;
    }
    if (!formData.street) {
      toast.error(t("validation.streetRequired"));
      return;
    }
    if (!formData.country) {
      toast.error(t("validation.countryRequired"));
      return;
    }
    if (!formData.province) {
      toast.error(t("validation.provinceRequired"));
      return;
    }
    if (!formData.accountType) {
      toast.error(t("validation.accountTypeRequired"));
      return;
    }

    if (!agreedToTerms) {
      toast.error(t("validation.termsRequired"));
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call

      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(t("auth.loginSuccess"));
      navigate("/signin");
      // Redirect logic would go here
    } catch (error) {
      toast.error(t("auth.loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    { code: "sy", name: language === "ar" ? "سوريا" : "Syria" },
    { code: "lb", name: language === "ar" ? "لبنان" : "Lebanon" },
    { code: "jo", name: language === "ar" ? "الأردن" : "Jordan" },
  ];
  const cityies = {
    دمشق: language === "ar" ? ["test1"] : ["test2"],
    Damascus: language === "ar" ? ["test1"] : ["test2"],
  };

  const provinces = {
    sy:
      language === "ar"
        ? [
            "دمشق",
            "حلب",
            "حمص",
            "حماة",
            "اللاذقية",
            "طرطوس",
            "درعا",
            "السويداء",
            "القنيطرة",
            "دير الزور",
            "الرقة",
            "الحسكة",
            "إدلب",
            "ريف دمشق",
          ]
        : [
            "Damascus",
            "Aleppo",
            "Homs",
            "Hama",
            "Latakia",
            "Tartus",
            "Daraa",
            "As-Suwayda",
            "Quneitra",
            "Deir ez-Zor",
            "Raqqa",
            "Al-Hasakah",
            "Idlib",
            "Rif Dimashq",
          ],
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-3 sm:p-4 lg:p-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-lg lg:max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-3 sm:space-y-4 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <Link
                to="/signin"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                <span className="ml-2 text-sm font-medium">
                  {t("auth.backToLogin")}
                </span>
              </Link>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("auth.createNewAccount")}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 px-2 sm:px-4">
                {t("auth.joinPlatform")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Personal Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {t("profile.personalInfo")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.firstName")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder={t("form.enterFirstName")}
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="h-11 sm:h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.lastName")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder={t("form.enterLastName")}
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="h-11 sm:h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("auth.emailAddress")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("form.enterEmail")}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-11 sm:h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("auth.phoneNumber")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("form.enterPhone")}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-11 sm:h-12 text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.password")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("form.enterPassword")}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="h-11 sm:h-12 text-base pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.confirmPassword")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("form.reenterPassword")}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="h-11 sm:h-12 text-base pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {t("auth.accountType")}
                </h3>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t("auth.accountType")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) =>
                      handleInputChange("accountType", value)
                    }
                  >
                    <SelectTrigger className="h-11 sm:h-12 text-base">
                      <SelectValue placeholder={t("form.selectAccountType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        {t("auth.individual")}
                      </SelectItem>
                      <SelectItem value="merchant">
                        {t("auth.merchant")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.accountType === "merchant" && (
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Label
                        htmlFor="companyName"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t("auth.companyName")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder={t("form.enterCompanyName")}
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        className="h-11 sm:h-12 text-base bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="commercialRegister"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t("auth.commercialRegister")}

                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="commercialRegister"
                        type="text"
                        placeholder={t("form.enterCommercialRegister")}
                        value={formData.commercialRegister}
                        onChange={(e) =>
                          handleInputChange(
                            "commercialRegister",
                            e.target.value
                          )
                        }
                        className="h-11 sm:h-12 text-base bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        {t("company.documents")}
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="fileUpload"
                        />
                        <label htmlFor="fileUpload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            {t("company.uploadDocuments")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("company.documentsDesc")}
                          </p>
                        </label>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {t("company.uploadedFiles")} ({uploadedFiles.length}{" "}
                            {t("company.filesUploaded")})
                          </p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm"
                              >
                                <span className="truncate flex-1 mr-2">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {t("sender.address")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t("auth.country")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        handleInputChange("country", value)
                      }
                    >
                      <SelectTrigger className="h-11 sm:h-12 text-base">
                        <SelectValue placeholder={t("form.selectCountry")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t("auth.province")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) =>
                        handleInputChange("province", value)
                      }
                      disabled={!formData.country}
                    >
                      <SelectTrigger className="h-11 sm:h-12 text-base">
                        <SelectValue placeholder={t("form.selectProvince")} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.country &&
                          provinces[
                            formData.country as keyof typeof provinces
                          ]?.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.city")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) =>
                        handleInputChange("city", value)
                      }
                      disabled={!formData.province}
                    >
                      <SelectTrigger className="h-11 sm:h-12 text-base">
                        <SelectValue placeholder={t("form.selectCity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.province &&
                          cityies[
                            formData.province as keyof typeof cityies
                          ]?.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="street"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("auth.street")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder={t("form.enterStreet")}
                      value={formData.street}
                      onChange={(e) =>
                        handleInputChange("street", e.target.value)
                      }
                      className="h-11 sm:h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg border">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(checked as boolean)
                    }
                    className="mt-0.5 flex-shrink-0"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                  >
                    {t("terms.agreeToTerms")}{" "}
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {t("terms.termsAndConditions")}
                    </Link>{" "}
                    {t("terms.and")}{" "}
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {t("terms.privacyPolicy")}
                    </Link>
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading
                  ? t("auth.creatingAccount")
                  : t("auth.createAccount")}
              </Button>

              {/* Sign In Link */}
              <div className="text-center pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-sm sm:text-base text-gray-600">
                  {t("auth.hasAccount")}{" "}
                  <Link
                    to="/signin"
                    className="text-blue-600 hover:text-blue-800 font-semibold underline transition-colors"
                  >
                    {t("auth.signInHere")}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
