import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
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
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("kashout_user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const tr = (ar: string, en: string) =>
    ((localStorage.getItem("language") as "ar" | "en") || "ar") === "ar"
      ? ar
      : en;

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const storedUser = localStorage.getItem("kashout_user");
      const token = localStorage.getItem("kashout_token");

      if (storedUser && token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          localStorage.setItem("kashout_user", JSON.stringify(userData));
        } catch (error) {
          localStorage.removeItem("kashout_user");
          localStorage.removeItem("kashout_token");
          localStorage.removeItem("kashout_refresh_token");
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("wallet-updated", (payload: any) => {
      if (payload?.balance) {
        setUser((prev) => {
          if (!prev) return prev;
          const nextUser = {
            ...prev,
            balance: {
              USD: Number(payload.balance.USD) || 0,
              SYP: Number(payload.balance.SYP) || 0,
            },
          };
          localStorage.setItem("kashout_user", JSON.stringify(nextUser));
          return nextUser;
        });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

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

      throw new Error(tr("فشل تسجيل الدخول", "Login failed"));
    } catch (error: any) {
      // Handle specific error types with detailed messages
      let errorMessage = tr("فشل تسجيل الدخول", "Login failed");

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_CREDENTIALS":
            errorMessage = tr(
              "البريد الإلكتروني وكلمة المرور مطلوبان",
              "Email and password are required",
            );
            break;
          case "USER_NOT_FOUND":
            errorMessage = tr(
              "البريد الإلكتروني غير موجود. يرجى التحقق من البريد الإلكتروني أو التسجيل.",
              "Email not found. Please verify your email or sign up.",
            );
            break;
          case "ACCOUNT_DEACTIVATED":
            errorMessage = tr(
              "تم إلغاء تنشيط حسابك. يرجى التواصل مع الدعم.",
              "Your account is deactivated. Please contact support.",
            );
            break;
          case "INVALID_PASSWORD":
            errorMessage = tr(
              "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
              "Incorrect password. Please try again.",
            );
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              tr("فشل تسجيل الدخول", "Login failed");
        }
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          tr("فشل تسجيل الدخول", "Login failed");
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
      toast.info(
        tr(
          "تسجيل الدخول عبر OTP غير متاح حالياً",
          "OTP login is currently unavailable",
        ),
      );
      return false;
    } catch (error: any) {
      toast.error(error.message || tr("فشل تسجيل الدخول", "Login failed"));
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

      throw new Error(tr("فشل التسجيل", "Registration failed"));
    } catch (error: any) {
      // Handle specific registration errors
      let errorMessage = tr("فشل التسجيل", "Registration failed");

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("User already exists")) {
          errorMessage = tr(
            "البريد الإلكتروني أو رقم الهاتف موجود مسبقاً. يرجى استخدام بيانات مختلفة.",
            "Email or phone already exists. Please use different details.",
          );
        } else if (error.response.data.message.includes("email")) {
          errorMessage = tr(
            "يرجى إدخال بريد إلكتروني صحيح.",
            "Please enter a valid email address.",
          );
        } else if (error.response.data.message.includes("password")) {
          errorMessage = tr(
            "كلمة المرور يجب أن تكون على الأقل 6 أحرف.",
            "Password must be at least 6 characters.",
          );
        } else if (error.response.data.message.includes("phone")) {
          errorMessage = tr(
            "يرجى إدخال رقم هاتف صحيح.",
            "Please enter a valid phone number.",
          );
        } else {
          errorMessage = error.response.data.message;
        }
      } else {
        errorMessage =
          error.message || tr("فشل التسجيل", "Registration failed");
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

      throw new Error(tr("فشل تغيير كلمة المرور", "Failed to change password"));
    } catch (error: any) {
      throw new Error(
        error.message ||
          tr("فشل تغيير كلمة المرور", "Failed to change password"),
      );
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

      throw new Error(
        tr("فشل في إرسال رابط إعادة التعيين", "Failed to send reset link"),
      );
    } catch (error: any) {
      // Handle specific forgot password errors
      let errorMessage = tr(
        "فشل في إرسال رابط إعادة التعيين",
        "Failed to send reset link",
      );

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_EMAIL":
            errorMessage = tr("البريد الإلكتروني مطلوب", "Email is required");
            break;
          case "USER_NOT_FOUND":
            errorMessage = tr(
              "البريد الإلكتروني غير موجود في النظام",
              "Email does not exist in the system",
            );
            break;
          case "ACCOUNT_DEACTIVATED":
            errorMessage = tr(
              "الحساب معطل. يرجى التواصل مع الدعم",
              "Account is deactivated. Please contact support",
            );
            break;
          case "RESET_ALREADY_SENT":
            errorMessage = tr(
              "تم إرسال رابط إعادة التعيين بالفعل. يرجى التحقق من بريدك الإلكتروني",
              "Reset link was already sent. Please check your email",
            );
            break;
          case "EMAIL_SEND_FAILED":
            errorMessage = tr(
              "فشل في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى لاحقاً",
              "Failed to send email. Please try again later",
            );
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              tr(
                "فشل في إرسال رابط إعادة التعيين",
                "Failed to send reset link",
              );
        }
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          tr("فشل في إرسال رابط إعادة التعيين", "Failed to send reset link");
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

      throw new Error(
        tr("فشل في إعادة تعيين كلمة المرور", "Failed to reset password"),
      );
    } catch (error: any) {
      // Handle specific reset password errors
      let errorMessage = tr(
        "فشل في إعادة تعيين كلمة المرور",
        "Failed to reset password",
      );

      if (error.response?.data?.errorType) {
        switch (error.response.data.errorType) {
          case "MISSING_DATA":
            errorMessage = tr(
              "الرمز المميز وكلمة المرور الجديدة مطلوبان",
              "Token and new password are required",
            );
            break;
          case "INVALID_TOKEN":
            errorMessage = tr(
              "الرمز المميز غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد",
              "Token is invalid or expired. Please request a new link",
            );
            break;
          case "INVALID_PASSWORD":
            errorMessage = tr(
              "كلمة المرور يجب أن تكون على الأقل 6 أحرف",
              "Password must be at least 6 characters",
            );
            break;
          default:
            errorMessage =
              error.response.data.message ||
              error.message ||
              tr("فشل في إعادة تعيين كلمة المرور", "Failed to reset password");
        }
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          tr("فشل في إعادة تعيين كلمة المرور", "Failed to reset password");
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
      toast.success(tr("تم تسجيل الخروج بنجاح", "Logged out successfully"));
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
