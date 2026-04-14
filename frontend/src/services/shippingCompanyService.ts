import api, { handleApiError } from "./api";

class ShippingCompanyService {
  async getShippingCompanies(shippingType?: "local" | "international") {
    try {
      const response = await api.get("/shipping-companies", {
        params: shippingType ? { shippingType } : undefined,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ShippingCompanyService();