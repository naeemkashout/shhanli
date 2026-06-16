import api, { handleApiError } from "./api";

export interface CreateShipmentData {
  shippingType: "local" | "international";
  sender: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    street: string;
    country: string;
    state: string;
    city: string;
    clientType: "individual" | "merchant";
    companyName?: string;
    commercialRegister?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  receivers: Array<{
    name: string;
    phone: string;
    email?: string;
    address?: string;
    street: string;
    country: string;
    state: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  package: {
    type: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    description: string;
    value: number;
    currency: string;
    fragile?: boolean;
    packagingRequested?: boolean;
  };
  shippingCompany: {
    id: string;
    name: string;
  };
  cost: {
    amount: number;
    currency: string;
    paymentMethod: "wallet" | "cod";
    packagingFee?: number;
    volumetricWeight?: number;
    actualWeight?: number;
    billingWeight?: number;
  };
  notes?: string;
}

class ShipmentService {
  async createShipment(
    data: CreateShipmentData | FormData,
    isFormData = false,
  ): Promise<any> {
    try {
      const config = isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined;
      const response = await api.post("/shipments", data, config);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getUserShipments(params?: {
    status?: string;
    search?: string;
    company?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/shipments", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getShipmentById(id: string): Promise<any> {
    try {
      const response = await api.get(`/shipments/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const response = await api.get(`/shipments/track/${trackingNumber}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async cancelShipment(id: string, reason: string): Promise<any> {
    try {
      const response = await api.put(`/shipments/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async requestShipmentEdit(
    id: string,
    data: { reason: string; requestedChanges: string },
  ): Promise<any> {
    try {
      const response = await api.put(`/shipments/${id}/edit-request`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ShipmentService();
