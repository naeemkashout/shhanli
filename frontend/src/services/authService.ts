import api, { handleApiError } from "./api";
import userService from "./userService";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessType?: string;
  companyName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: any;
    token: string;
    refreshToken: string;
  };
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const payload = {
        ...data,
        email: String(data.email || "")
          .trim()
          .toLowerCase(),
        phone: String(data.phone || "").trim(),
      };

      const response = await api.post("/auth/register", payload);

      // Store tokens and user data
      if (response.data.success) {
        localStorage.setItem("kashout_token", response.data.data.token);
        localStorage.setItem(
          "kashout_refresh_token",
          response.data.data.refreshToken,
        );
        localStorage.setItem(
          "kashout_user",
          JSON.stringify(response.data.data.user),
        );
      }

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const payload = {
        ...credentials,
        email: String(credentials.email || "")
          .trim()
          .toLowerCase(),
      };

      const response = await api.post("/auth/login", payload);

      // Store tokens and user data
      if (response.data.success) {
        localStorage.setItem("kashout_token", response.data.data.token);
        localStorage.setItem(
          "kashout_refresh_token",
          response.data.data.refreshToken,
        );
        localStorage.setItem(
          "kashout_user",
          JSON.stringify(response.data.data.user),
        );
      }

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("kashout_token");
      localStorage.removeItem("kashout_refresh_token");
      localStorage.removeItem("kashout_user");
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await api.get("/auth/me");
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async changePassword(data: ChangePasswordData): Promise<any> {
    try {
      const response = await userService.changePassword(data);
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async forgotPassword(data: ForgotPasswordData): Promise<any> {
    try {
      const response = await api.post("/auth/forgot-password", {
        ...data,
        email: String(data.email || "")
          .trim()
          .toLowerCase(),
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<any> {
    try {
      const response = await api.post("/auth/reset-password", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("kashout_token");
  }

  getToken(): string | null {
    return localStorage.getItem("kashout_token");
  }

  getUser(): any | null {
    const userStr = localStorage.getItem("kashout_user");
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
