import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "@/services/authService";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName?: string;
  commercialRegistrationNumber?: string;
  businessType: "individual" | "merchant";
  balance: {
    USD: number;
    SYP: number;
  };
  role?: string;
  shippingCompanyId?:
    | string
    | {
        _id: string;
        name: string;
        code: string;
        isActive: boolean;
      }
    | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  forgotPassword: (data: {
    email: string;
  }) => Promise<{ success: boolean; previewUrl?: string }>;
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }) => Promise<boolean>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName?: string;
  businessType?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for stored user data and validate token
    const initAuth = async () => {
      const storedUser = localStorage.getItem("kashout_user");
      const token = localStorage.getItem("kashout_token");

      if (storedUser && token) {
        try {
          // Validate token by fetching current user
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem("kashout_user");
          localStorage.removeItem("kashout_token");
          localStorage.removeItem("kashout_refresh_token");
        }
      }
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem("kashout_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        setUser(response.data.user);
        return true;
      }

      throw new Error("فشل تسجيل الدخول");
    } catch (error: any) {
      // Handle specific error types with detailed messages
      let errorMessage = "فشل تسجيل الدخول";

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_CREDENTIALS":
            errorMessage = "البريد الإلكتروني وكلمة المرور مطلوبان";
            break;
          case "USER_NOT_FOUND":
            errorMessage =
              "البريد الإلكتروني غير موجود. يرجى التحقق من البريد الإلكتروني أو التسجيل.";
            break;
          case "ACCOUNT_DEACTIVATED":
            errorMessage = "تم إلغاء تنشيط حسابك. يرجى التواصل مع الدعم.";
            break;
          case "INVALID_PASSWORD":
            errorMessage = "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.";
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              "فشل تسجيل الدخول";
        }
      } else {
        errorMessage =
          error.response?.data?.message || error.message || "فشل تسجيل الدخول";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (
    phone: string,
    otp: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // For now, use regular login (OTP not implemented in backend yet)
      toast.info("تسجيل الدخول عبر OTP غير متاح حالياً");
      return false;
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل الدخول");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);

      if (response.success) {
        setUser(response.data.user);
        return true;
      }

      throw new Error("فشل التسجيل");
    } catch (error: any) {
      // Handle specific registration errors
      let errorMessage = "فشل التسجيل";

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("User already exists")) {
          errorMessage =
            "البريد الإلكتروني أو رقم الهاتف موجود مسبقاً. يرجى استخدام بيانات مختلفة.";
        } else if (error.response.data.message.includes("email")) {
          errorMessage = "يرجى إدخال بريد إلكتروني صحيح.";
        } else if (error.response.data.message.includes("password")) {
          errorMessage = "كلمة المرور يجب أن تكون على الأقل 6 أحرف.";
        } else if (error.response.data.message.includes("phone")) {
          errorMessage = "يرجى إدخال رقم هاتف صحيح.";
        } else {
          errorMessage = error.response.data.message;
        }
      } else {
        errorMessage = error.message || "فشل التسجيل";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        return true;
      }

      throw new Error("فشل تغيير كلمة المرور");
    } catch (error: any) {
      throw new Error(error.message || "فشل تغيير كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (data: {
    email: string;
  }): Promise<{ success: boolean; previewUrl?: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(data);

      if (response.success) {
        return {
          success: true,
          previewUrl: response?.data?.previewUrl || undefined,
        };
      }

      throw new Error("فشل في إرسال رابط إعادة التعيين");
    } catch (error: any) {
      // Handle specific forgot password errors
      let errorMessage = "فشل في إرسال رابط إعادة التعيين";

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_EMAIL":
            errorMessage = "البريد الإلكتروني مطلوب";
            break;
          case "USER_NOT_FOUND":
            errorMessage = "البريد الإلكتروني غير موجود في النظام";
            break;
          case "ACCOUNT_DEACTIVATED":
            errorMessage = "الحساب معطل. يرجى التواصل مع الدعم";
            break;
          case "RESET_ALREADY_SENT":
            errorMessage =
              "تم إرسال رابط إعادة التعيين بالفعل. يرجى التحقق من بريدك الإلكتروني";
            break;
          case "EMAIL_SEND_FAILED":
            errorMessage =
              "فشل في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى لاحقاً";
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              "فشل في إرسال رابط إعادة التعيين";
        }
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          "فشل في إرسال رابط إعادة التعيين";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: {
    token: string;
    newPassword: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.resetPassword(data);

      if (response.success) {
        return true;
      }

      throw new Error("فشل في إعادة تعيين كلمة المرور");
    } catch (error: any) {
      // Handle specific reset password errors
      let errorMessage = "فشل في إعادة تعيين كلمة المرور";

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_DATA":
            errorMessage = "الرمز المميز وكلمة المرور الجديدة مطلوبان";
            break;
          case "INVALID_TOKEN":
            errorMessage =
              "الرمز المميز غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد";
            break;
          case "INVALID_PASSWORD":
            errorMessage = "كلمة المرور يجب أن تكون على الأقل 6 أحرف";
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              "فشل في إعادة تعيين كلمة المرور";
        }
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          "فشل في إعادة تعيين كلمة المرور";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local state anyway
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithPhone,
        register,
        logout,
        updatePassword,
        forgotPassword,
        resetPassword,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
