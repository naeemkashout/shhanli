import api, { handleApiError } from "./api";

export interface CreateShipmentData {
  sender: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  package: {
    type: string;
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    description?: string;
    value?: number;
    quantity?: number;
  };
  service: {
    type: string;
    deliveryTime?: string;
  };
  cost: {
    amount: number;
    currency: string;
    paymentMethod: string;
  };
  notes?: string;
}

class ShipmentService {
  async createShipment(data: CreateShipmentData): Promise<any> {
    try {
      const response = await api.post("/shipments", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getUserShipments(params?: {
    status?: string;
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

  async cancelShipment(id: string): Promise<any> {
    try {
      const response = await api.put(`/shipments/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ShipmentService();
