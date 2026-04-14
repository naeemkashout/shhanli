import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Circle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import notificationService from "@/services/notificationService";

type NotificationStatusFilter = "all" | "unread";

interface NotificationItem {
  _id: string;
  type: "shipment" | "wallet" | "system";
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    shipmentId?: string;
    transactionId?: string;
    trackingNumber?: string;
    [key: string]: any;
  };
}

export default function Notifications() {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all");

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        status: statusFilter,
        page: 1,
        limit: 100,
      });
      const loadedNotifications = response?.data || [];
      setNotifications(loadedNotifications);

      const unreadCount = loadedNotifications.filter((item: NotificationItem) => !item.isRead).length;
      window.dispatchEvent(
        new CustomEvent("notifications:sync", {
          detail: { unreadCount },
        }),
      );
    } catch (error: any) {
      toast.error(error.message || t("notifications.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [statusFilter]);

  useEffect(() => {
    const autoMarkAllAsRead = async () => {
      try {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        window.dispatchEvent(
          new CustomEvent("notifications:sync", {
            detail: { unreadCount: 0 },
          }),
        );
      } catch (error) {
        // Keep silent to avoid noisy UX when there is nothing to mark.
      }
    };

    autoMarkAllAsRead();
  }, []);

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!userId) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("new-notification", (notification: NotificationItem) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        const unreadCount = updated.filter((item) => !item.isRead).length;
        window.dispatchEvent(
          new CustomEvent("notifications:sync", {
            detail: { unreadCount },
          }),
        );
        return updated;
      });
      toast.info(
        language === "ar" ? notification.titleAr : notification.titleEn,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, language]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => {
        const updated = prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        );
        const unreadCount = updated.filter((item) => !item.isRead).length;
        window.dispatchEvent(
          new CustomEvent("notifications:sync", {
            detail: { unreadCount },
          }),
        );
        return updated;
      });
    } catch (error: any) {
      toast.error(error.message || t("notifications.markReadError"));
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === "shipment") return t("notifications.typeShipment");
    if (type === "wallet") return t("notifications.typeWallet");
    return t("notifications.typeSystem");
  };

  const getNotificationTarget = (item: NotificationItem) => {
    if (item.metadata?.shipmentId) {
      return `/shipments?shipmentId=${encodeURIComponent(item.metadata.shipmentId)}`;
    }

    if (item.metadata?.transactionId) {
      return `/financial-transactions?transactionId=${encodeURIComponent(item.metadata.transactionId)}`;
    }

    if (item.type === "wallet") {
      return "/financial-transactions";
    }

    if (item.type === "shipment") {
      return "/shipments";
    }

    return null;
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    const target = getNotificationTarget(item);

    if (!item.isRead) {
      await markAsRead(item._id);
    }

    if (target) {
      navigate(target);
    }
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("notifications.title")}</h1>
          <p className="text-sm text-gray-600">{t("notifications.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800">
            {t("notifications.unreadCount", { count: unreadCount })}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as NotificationStatusFilter)}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterAll")}</SelectItem>
                <SelectItem value="unread">{t("notifications.filterUnread")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>{t("notifications.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 border rounded-lg transition-colors ${
                    item.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                  } ${getNotificationTarget(item) ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50/70" : ""}`}
                  onClick={() => void handleNotificationClick(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!item.isRead && <Circle className="w-3 h-3 text-blue-600 fill-blue-600" />}
                        <h3 className="font-semibold text-gray-900">
                          {language === "ar" ? item.titleAr : item.titleEn}
                        </h3>
                        <Badge variant="secondary">{getTypeLabel(item.type)}</Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {language === "ar" ? item.messageAr : item.messageEn}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString(language === "ar" ? "ar-SY" : "en-US")}
                      </p>
                    </div>
                    {!item.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          void markAsRead(item._id);
                        }}
                      >
                        {t("notifications.markRead")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
