import api, { handleApiError } from "./api";

export interface DepositData {
  amount: number;
  currency: string;
  provider?: string;
}

export interface DepositRequestResponse {
  transactionId: string;
  paymentId?: string;
  status?: string;
  otpRequired?: boolean;
  customerMSISDN?: string;
}

export interface DepositConfirmationData {
  transactionId: string;
  otp: string;
}

export interface DepositStatusData {
  paymentId: string;
  gatewayStatus: string;
  transactionStatus: string;
  isFinal?: boolean;
  balance?: {
    USD?: number;
    SYP?: number;
  };
}

export interface WithdrawalRequestData {
  amount: number;
  currency: string;
  method: string;
  notes?: string;
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

  async confirmDeposit(data: DepositConfirmationData): Promise<any> {
    try {
      const response = await api.post("/wallet/deposit/confirm", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async resendDepositOtp(transactionId: string): Promise<any> {
    try {
      const response = await api.post("/wallet/deposit/resend-otp", {
        transactionId,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async checkDepositStatus(paymentId: string): Promise<DepositStatusData> {
    try {
      const response = await api.get(`/wallet/deposit/status/${paymentId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async cancelDeposit(paymentId: string): Promise<any> {
    try {
      const response = await api.post(`/wallet/deposit/cancel/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async requestWithdrawal(data: WithdrawalRequestData): Promise<any> {
    try {
      const response = await api.post("/wallet/withdraw", data);
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

  async exportTransactionsExcel(params?: {
    type?: string;
    status?: string;
    currency?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: "ar" | "en";
  }): Promise<Blob> {
    try {
      const response = await api.get("/wallet/transactions/export/excel", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new WalletService();
