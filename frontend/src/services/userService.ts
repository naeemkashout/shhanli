import api, { handleApiError } from "./api";

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  commercialRegistrationNumber?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async getProfile(): Promise<any> {
    try {
      const response = await api.get("/users/profile");
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<any> {
    try {
      const response = await api.put("/users/profile", data);

      // Update stored user data
      if (response.data.success) {
        localStorage.setItem(
          "kashout_user",
          JSON.stringify(response.data.data)
        );
      }

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async changePassword(data: ChangePasswordData): Promise<any> {
    try {
      const response = await api.put("/users/change-password", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new UserService();
