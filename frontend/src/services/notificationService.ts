import api, { handleApiError } from "./api";

class NotificationService {
  async getNotifications(params?: {
    status?: "all" | "unread";
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get("/notifications/unread-count");
      return Number(response.data?.data?.unreadCount || 0);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async markAsRead(id: string): Promise<any> {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async markAllAsRead(): Promise<any> {
    try {
      const response = await api.put("/notifications/read-all");
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new NotificationService();
