import api, { handleApiError } from "./api";

class AdminService {
  // Dashboard Stats
  async getDashboardStats(period: string = "30"): Promise<any> {
    try {
      const response = await api.get("/admin/stats", { params: { period } });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Users Management
  async getAllUsers(params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/users", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateUser(id: string, data: any): Promise<any> {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteUser(id: string): Promise<any> {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Shipments Management
  async getAllShipments(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/shipments", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateShipmentStatus(
    id: string,
    data: {
      status: string;
      note?: string;
      location?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.put(`/admin/shipments/${id}/status`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Transactions
  async getAllTransactions(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/transactions", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Activity Logs
  async getActivityLogs(params?: {
    action?: string;
    category?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/activity-logs", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Export
  async exportToExcel(type: "users" | "shipments"): Promise<Blob> {
    try {
      const response = await api.get("/admin/export/excel", {
        params: { type },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AdminService();
