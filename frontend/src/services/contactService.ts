import api, { handleApiError } from "./api";

export interface CreateContactData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  street: string;
  country: string;
  state: string;
  city: string;
  clientType: "individual" | "merchant";
  companyName?: string;
  commercialRegister?: string;
  type: "sender" | "receiver" | "both";
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class ContactService {
  async getUserContacts(params?: {
    search?: string;
    type?: string;
    clientType?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/contacts", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createContact(data: CreateContactData): Promise<any> {
    try {
      const response = await api.post("/contacts", data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateContact(
    id: string,
    data: Partial<CreateContactData>,
  ): Promise<any> {
    try {
      const response = await api.put(`/contacts/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteContact(id: string): Promise<any> {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getContactById(id: string): Promise<any> {
    try {
      const response = await api.get(`/contacts/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ContactService();
