import api, { handleApiError } from "./api";

export interface DepositData {
  amount: number;
  currency: string;
  method: string;
}

class WalletService {
  async getBalance(): Promise<any> {
    try {
      const response = await api.get("/wallet/balance");
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deposit(data: DepositData): Promise<any> {
    try {
      const response = await api.post("/wallet/deposit", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getTransactions(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/wallet/transactions", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getTransactionById(id: string): Promise<any> {
    try {
      const response = await api.get(`/wallet/transactions/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new WalletService();
