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

  // Companies Management
  async getAllCompanies(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/companies", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getMyCompany(): Promise<any> {
    try {
      const response = await api.get("/admin/companies/me");
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createCompany(data: any): Promise<any> {
    try {
      const response = await api.post("/admin/companies", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateCompany(id: string, data: any): Promise<any> {
    try {
      const response = await api.put(`/admin/companies/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateMyCompany(data: any): Promise<any> {
    try {
      const response = await api.put("/admin/companies/me", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteCompany(id: string): Promise<any> {
    try {
      const response = await api.delete(`/admin/companies/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async upsertCompanyAdminAccount(
    companyId: string,
    data: {
      name?: string;
      email: string;
      phone?: string;
      password?: string;
      resetPassword?: boolean;
    },
  ): Promise<any> {
    try {
      const response = await api.post(
        `/admin/companies/${companyId}/admin-account`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async uploadCompanyLogo(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post(
        "/admin/companies/upload-logo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data.data.logoUrl;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Users Management
  async getAllUsers(params?: {
    search?: string;
    role?: string;
    companyId?: string;
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
    companyId?: string;
    companyName?: string;
    senderName?: string;
    startDate?: string;
    endDate?: string;
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

  async getCancellationRequests(params?: {
    status?: "pending" | "approved" | "rejected" | "all";
    search?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/cancellation-requests", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getEditRequests(params?: {
    status?: "pending" | "approved" | "rejected" | "all";
    search?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/admin/edit-requests", {
        params,
      });
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
      correctedWeight?: number;
      weightAdjustmentNote?: string;
      shippingMode?: "standard" | "express";
      packagingRequested?: boolean;
      paymentMethod?: "wallet" | "cod";
    },
  ): Promise<any> {
    try {
      const response = await api.put(`/admin/shipments/${id}/status`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async reviewCancellationRequest(
    id: string,
    data: {
      action: "approve" | "reject";
      note?: string;
    },
  ): Promise<any> {
    try {
      const response = await api.put(
        `/admin/shipments/${id}/cancellation-request`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async reviewEditRequest(
    id: string,
    data: {
      action: "approve" | "reject";
      note?: string;
      shipmentUpdates?: Record<string, any>;
    },
  ): Promise<any> {
    try {
      const response = await api.put(
        `/admin/shipments/${id}/edit-request`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Transactions
  async getAllTransactions(params?: {
    type?: string;
    status?: string;
    scope?: "company-settlement" | "all";
    companyId?: string;
    search?: string;
    shipmentStatus?: string;
    paymentMethod?: string;
    currency?: string;
    dateFrom?: string;
    dateTo?: string;
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

  async reviewWithdrawalRequest(
    id: string,
    data: {
      action: "approve" | "reject";
      note?: string;
    },
  ): Promise<any> {
    try {
      const response = await api.put(
        `/admin/transactions/${id}/withdrawal-review`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async importComparisonInvoices(
    file: File,
    companyId?: string,
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (companyId) {
        formData.append("companyId", companyId);
      }

      const response = await api.post(
        "/admin/comparison-invoices/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Large comparison files can take several minutes to process.
          // Keep a long but finite timeout to avoid endless loading state.
          timeout: 15 * 60 * 1000,
        },
      );

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
  async exportToExcel(
    type: "users" | "shipments",
    params?: { language?: "ar" | "en" },
  ): Promise<Blob> {
    try {
      const response = await api.get("/admin/export/excel", {
        params: { type, ...params },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async exportCompanySettlementExcel(params?: {
    companyId?: string;
    search?: string;
    shipmentStatus?: string;
    paymentMethod?: string;
    currency?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: "ar" | "en";
  }): Promise<Blob> {
    try {
      const response = await api.get("/admin/export/excel", {
        params: {
          type: "company-settlement",
          ...params,
        },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async exportTransactionsExcel(params?: {
    transactionType?: string;
    status?: string;
    scope?: "company-settlement" | "all";
    search?: string;
    paymentMethod?: string;
    currency?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: "ar" | "en";
  }): Promise<Blob> {
    try {
      const response = await api.get("/admin/export/excel", {
        params: {
          type: "transactions",
          ...params,
        },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AdminService();
