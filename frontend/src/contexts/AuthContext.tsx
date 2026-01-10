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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
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
        toast.success("تم تسجيل الدخول بنجاح");
        return true;
      }

      return false;
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل الدخول");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (
    phone: string,
    otp: string
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
        toast.success("تم التسجيل بنجاح");
        return true;
      }

      return false;
    } catch (error: any) {
      toast.error(error.message || "فشل التسجيل");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        return true;
      }

      return false;
    } catch (error: any) {
      toast.error(error.message || "فشل تغيير كلمة المرور");
      return false;
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
