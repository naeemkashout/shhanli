import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeLocalApiUrl } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Package,
  Search,
  Eye,
  Printer,
  Download,
  Truck,
  Clock,
  Pencil,
  CheckCircle,
  AlertCircle,
  X,
  AlertTriangle,
  ExternalLink,
  User,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStatusColor } from "@/lib/statusUtils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import shipmentService from "@/services/shipmentService";
import shippingCompanyService from "@/services/shippingCompanyService";
import { io, Socket } from "socket.io-client";

interface Shipment {
  _id: string;
  trackingNumber: string;
  sender: {
    name: string;
    phone: string;
    email: string;
    country: string;
    state: string;
    city: string;
    street: string;
    clientType: "individual" | "merchant";
    companyName?: string;
    commercialRegister?: string;
  };
  receivers: Array<{
    name: string;
    phone: string;
    email?: string;
    country: string;
    state: string;
    city: string;
    street: string;
  }>;
  package: {
    type: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    dimensions?: string;
    description: string;
    value: number;
    currency: string;
    fragile?: boolean;
    packagingRequested?: boolean;
  };
  status:
    | "pending"
    | "confirmed"
    | "picked-up"
    | "in-transit"
    | "out-for-delivery"
    | "delivered"
    | "cancelled"
    | "returned";
  shippingCompany: {
    id: string;
    name: string;
    logoUrl?: string;
    trackingUrlTemplate?: string;
  };
  statusHistory?: Array<{
    status: string;
    note?: string;
    location?: string;
    timestamp?: string;
  }>;
  cost: {
    amount: number;
    currency: string;
    paymentMethod: string;
    packagingFee?: number;
  };
  cancellationRequest?: {
    isRequested?: boolean;
    reason?: string;
    status?: "pending" | "approved" | "rejected" | null;
    reviewNote?: string;
  };
  editRequest?: {
    isRequested?: boolean;
    reason?: string;
    requestedChanges?: string;
    status?: "pending" | "approved" | "rejected" | null;
    reviewNote?: string;
  };
  weightAdjustment?: {
    isAdjusted?: boolean;
    originalWeight?: number;
    correctedWeight?: number;
    note?: string;
    adjustedAt?: string;
    balanceDeduction?: {
      required?: boolean;
      amount?: number;
      currency?: string;
      status?: "not-required" | "deducted" | "insufficient-cancelled";
      note?: string;
    };
  };
  createdAt: string;
  estimatedDelivery?: string;
}

export default function Shipments() {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editRequestedChanges, setEditRequestedChanges] = useState("");
  const [notifiedWeightAdjustments, setNotifiedWeightAdjustments] = useState<
    Set<string>
  >(new Set());
  const [companyLogosById, setCompanyLogosById] = useState<
    Record<string, string>
  >({});

  // Load shipments from API
  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true);
        const response = await shipmentService.getUserShipments({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchTerm?.trim() || undefined,
          company: companyFilter === "all" ? undefined : companyFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          limit,
        });

        if (response.success && response.data) {
          setShipments(response.data);
          setTotalPages(response.pagination?.pages || 1);
          setTotalItems(response.pagination?.total || response.data.length);
        }
      } catch (error: any) {
        console.error("Error loading shipments:", error);
        toast.error(
          language === "ar"
            ? "حدث خطأ في تحميل الشحنات"
            : "Error loading shipments",
        );
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
  }, [statusFilter, companyFilter, dateFrom, dateTo, searchTerm, language, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, companyFilter, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    const loadCompanyLogos = async () => {
      try {
        const companies = await shippingCompanyService.getShippingCompanies();
        const logosMap = (companies || []).reduce(
          (acc: Record<string, string>, company: any) => {
            if (company?._id && company?.logoUrl) {
              acc[String(company._id)] = String(company.logoUrl);
            }
            return acc;
          },
          {},
        );
        setCompanyLogosById(logosMap);
      } catch {
        setCompanyLogosById({});
      }
    };

    loadCompanyLogos();
  }, []);

  const getCompanyLogoForShipment = (shipment: Shipment) => {
    if (shipment.shippingCompany?.logoUrl)
      return shipment.shippingCompany.logoUrl;
    return companyLogosById[String(shipment.shippingCompany?.id || "")] || "";
  };

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!userId) return;

    const apiBaseUrl = normalizeLocalApiUrl(
      import.meta.env.VITE_API_URL || "http://localhost:5001/api",
    );
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("shipment-weight-adjusted", (payload: any) => {
      if (String(payload?.userId || "") !== userId) return;
      // ...existing code for weight adjustment event...
      // ...existing code...
    });

    // استقبال تحديث حالة الشحنة من الشركة أو الإدارة
    const shipmentUpdateEvent = `shipment-update-${userId}`;
    socket.on(shipmentUpdateEvent, (payload: any) => {
      if (!payload?.shipment?._id) return;
      setShipments((prev) =>
        prev.map((shipment) =>
          shipment._id === payload.shipment._id
            ? { ...shipment, ...payload.shipment, status: payload.status }
            : shipment,
        ),
      );
      toast.info(
        language === "ar"
          ? `تم تحديث حالة الشحنة (${payload.shipment.trackingNumber}) إلى: ${payload.status}`
          : `Shipment (${payload.shipment.trackingNumber}) status updated to: ${payload.status}`,
      );
    });

    socket.on("edit-request-reviewed", (payload: any) => {
      if (!payload?.shipmentId) return;

      toast.info(
        payload?.action === "approve"
          ? language === "ar"
            ? `تمت الموافقة على طلب تعديل الشحنة ${payload?.trackingNumber || ""}`
            : `Shipment edit request approved for ${payload?.trackingNumber || ""}`
          : language === "ar"
            ? `تم رفض طلب تعديل الشحنة ${payload?.trackingNumber || ""}`
            : `Shipment edit request rejected for ${payload?.trackingNumber || ""}`,
      );

      setShipments((prev) =>
        prev.map((shipment) =>
          shipment._id === payload.shipmentId
            ? {
                ...shipment,
                editRequest: {
                  ...(shipment.editRequest || {}),
                  status: payload?.status || shipment.editRequest?.status,
                  reviewNote: payload?.note || shipment.editRequest?.reviewNote,
                },
              }
            : shipment,
        ),
      );

      setSelectedShipment((prev) =>
        prev && prev._id === payload.shipmentId
          ? {
              ...prev,
              editRequest: {
                ...(prev.editRequest || {}),
                status: payload?.status || prev.editRequest?.status,
                reviewNote: payload?.note || prev.editRequest?.reviewNote,
              },
            }
          : prev,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, language]);

  useEffect(() => {
    const adjusted = shipments.filter(
      (shipment) => shipment.weightAdjustment?.isAdjusted,
    );
    if (!adjusted.length) return;

    const newIds = adjusted
      .map((shipment) => shipment._id)
      .filter((id) => !notifiedWeightAdjustments.has(id));

    if (!newIds.length) return;

    const count = newIds.length;
    toast.info(
      language === "ar"
        ? `لديك ${count} شحنة تم تعديل وزنها من شركة الشحن`
        : `You have ${count} shipment(s) with adjusted weight`,
    );

    setNotifiedWeightAdjustments((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }, [shipments, language, notifiedWeightAdjustments]);

  useEffect(() => {
    const shipmentId = String(searchParams.get("shipmentId") || "").trim();
    if (!shipmentId || !shipments.length) return;

    const matchedShipment = shipments.find(
      (shipment) => shipment._id === shipmentId,
    );
    if (!matchedShipment) return;

    setSelectedShipment(matchedShipment);
    setIsDetailsOpen(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("shipmentId");
    setSearchParams(nextParams, { replace: true });
  }, [shipments, searchParams, setSearchParams]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "picked-up":
        return <Package className="w-4 h-4" />;
      case "out-for-delivery":
        return <ExternalLink className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "in-transit":
        return <Truck className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      case "returned":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTrackingUrl = (shipment: Shipment) => {
    const trackingNumber = String(shipment.trackingNumber || "").trim();
    const template = String(
      shipment.shippingCompany?.trackingUrlTemplate || "",
    ).trim();

    if (template) {
      if (template.includes("{trackingNumber}")) {
        return template.replaceAll(
          "{trackingNumber}",
          encodeURIComponent(trackingNumber),
        );
      }

      const separator = template.includes("?") ? "&" : "?";
      return `${template}${separator}trackingNumber=${encodeURIComponent(trackingNumber)}`;
    }

    return `https://www.google.com/search?q=track+${encodeURIComponent(
      shipment.shippingCompany?.name || "shipment",
    )}+${encodeURIComponent(trackingNumber)}`;
  };

  const handleTrackShipment = (shipment: Shipment) => {
    const trackingUrl = getTrackingUrl(shipment);
    window.open(trackingUrl, "_blank");
    toast.success(
      language === "ar"
        ? `تم فتح صفحة تتبع الشحنة ${shipment.trackingNumber}`
        : `Tracking page opened for shipment ${shipment.trackingNumber}`,
    );
  };

  const canUseShipmentDocuments = (shipment?: Shipment | null) => {
    if (!shipment) return false;

    return (
      shipment.status !== "cancelled" &&
      shipment.cancellationRequest?.status !== "approved"
    );
  };

  const canTrackShipment = (shipment?: Shipment | null) => {
    if (!shipment) return false;
    return shipment.status === "in-transit";
  };

  const canRequestShipmentEdit = (shipment?: Shipment | null) => {
    if (!shipment) return false;

    // لا يسمح بطلب التعديل إلا إذا كانت الشحنة معلقة فقط
    return (
      shipment.status === "pending" &&
      shipment.cancellationRequest?.status !== "pending" &&
      !shipment.editRequest?.isRequested &&
      !shipment.editRequest?.status
    );
  };

  const filteredShipments = shipments;

  const companyFilterOptions = useMemo(() => {
    const companies = Array.from(
      new Set(
        shipments
          .map((shipment) => shipment.shippingCompany?.name?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    );

    return companies.sort((a, b) =>
      a.localeCompare(b, language === "ar" ? "ar" : "en", {
        sensitivity: "base",
      }),
    );
  }, [shipments, language]);

  const adjustedWeightShipmentsCount = useMemo(
    () =>
      shipments.filter((shipment) => shipment.weightAdjustment?.isAdjusted)
        .length,
    [shipments],
  );

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsOpen(true);
  };

  const handlePrintBill = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsPrintDialogOpen(true);
  };

  const handleCancelShipment = (shipment: Shipment) => {
    if (shipment.status !== "pending") {
      toast.error(t("shipments.cannotCancelApproved"));
      return;
    }
    setSelectedShipment(shipment);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  const handleRequestShipmentEdit = (shipment: Shipment) => {
    if (shipment.status !== "pending") {
      toast.error(
        language === "ar"
          ? "يمكن طلب تعديل الشحنة فقط عندما تكون بحالة معلقة"
          : "Shipment edit request is only available for pending shipments",
      );
      return;
    }

    if (shipment.cancellationRequest?.status === "pending") {
      toast.error(
        language === "ar"
          ? "لا يمكن طلب تعديل أثناء وجود طلب إلغاء قيد المراجعة"
          : "Cannot request edit while cancellation request is pending",
      );
      return;
    }

    if (shipment.editRequest?.isRequested || shipment.editRequest?.status) {
      toast.error(
        language === "ar"
          ? "تم إرسال طلب تعديل لهذه الشحنة مسبقًا"
          : "An edit request has already been sent for this shipment",
      );
      return;
    }

    setSelectedShipment(shipment);
    setEditReason("");
    setEditRequestedChanges("");
    setIsEditDialogOpen(true);
  };

  const confirmCancelShipment = async () => {
    if (!selectedShipment || !cancelReason.trim()) {
      toast.error(t("shipments.enterCancelReason"));
      return;
    }

    try {
      await shipmentService.cancelShipment(
        selectedShipment._id,
        cancelReason.trim(),
      );

      // Update local state
      setShipments((prev) =>
        prev.map((shipment) =>
          shipment._id === selectedShipment._id
            ? {
                ...shipment,
                cancellationRequest: {
                  isRequested: true,
                  reason: cancelReason.trim(),
                  status: "pending",
                },
              }
            : shipment,
        ),
      );

      toast.success(
        t("shipments.cancelRequestSent", {
          trackingNumber: selectedShipment.trackingNumber,
        }),
      );
      setIsCancelDialogOpen(false);
      setSelectedShipment(null);
      setCancelReason("");
    } catch (error: any) {
      toast.error(
        language === "ar"
          ? "حدث خطأ في إلغاء الشحنة"
          : "Error cancelling shipment",
      );
    }
  };

  const confirmEditShipmentRequest = async () => {
    if (
      !selectedShipment ||
      !editReason.trim() ||
      !editRequestedChanges.trim()
    ) {
      toast.error(
        language === "ar"
          ? "الرجاء إدخال سبب التعديل والتعديلات المطلوبة"
          : "Please enter both reason and requested changes",
      );
      return;
    }

    try {
      await shipmentService.requestShipmentEdit(selectedShipment._id, {
        reason: editReason.trim(),
        requestedChanges: editRequestedChanges.trim(),
      });

      setShipments((prev) =>
        prev.map((shipment) =>
          shipment._id === selectedShipment._id
            ? {
                ...shipment,
                editRequest: {
                  isRequested: true,
                  reason: editReason.trim(),
                  requestedChanges: editRequestedChanges.trim(),
                  status: "pending",
                },
              }
            : shipment,
        ),
      );

      toast.success(
        language === "ar"
          ? `تم إرسال طلب تعديل للشحنة ${selectedShipment.trackingNumber}`
          : `Edit request sent for shipment ${selectedShipment.trackingNumber}`,
      );

      setIsEditDialogOpen(false);
      setEditReason("");
      setEditRequestedChanges("");
      setSelectedShipment(null);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (language === "ar"
            ? "حدث خطأ أثناء إرسال طلب التعديل"
            : "Error submitting shipment edit request"),
      );
    }
  };

  const toDataUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Generate PDF for shipment
  const generatePDF = async (shipment: Shipment) => {
    const html = generatePrintContent(shipment);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("Failed to load PDF iframe"));
    });

    const iframeDocument = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDocument) {
      document.body.removeChild(iframe);
      throw new Error("Unable to access iframe document");
    }

    await (iframeDocument as any).fonts?.ready;

    const canvas = await html2canvas(iframeDocument.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: iframeDocument.body.scrollWidth,
      height: iframeDocument.body.scrollHeight,
    });

    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = (pdf as any).getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`Shipping-Bill-${shipment.trackingNumber}.pdf`);
  };

  const handleDownloadPDF = async () => {
    if (!selectedShipment) return;

    try {
      await generatePDF(selectedShipment);
      toast.success(
        language === "ar"
          ? `تم تحميل البوليصة ${selectedShipment.trackingNumber} كملف PDF`
          : `Shipment bill ${selectedShipment.trackingNumber} downloaded as PDF`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        language === "ar"
          ? "حدث خطأ أثناء تحميل ملف PDF"
          : "Error generating PDF file",
      );
    }
    setIsPrintDialogOpen(false);
  };

  const generatePrintContent = (shipment: Shipment) => {
    const receiver = shipment.receivers[0];
    const createdDate = new Date(shipment.createdAt).toLocaleDateString(
      isRTL ? "ar-SY" : "en-US",
    );
    const qrPayload = [
      `Tracking:${shipment.trackingNumber}`,
      `Company:${shipment.shippingCompany.name}`,
      `Sender:${shipment.sender.name}`,
      `Receiver:${receiver?.name || "-"}`,
      `Created:${createdDate}`,
    ].join(" | ");
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      qrPayload,
    )}`;
    const logoSrc = `${window.location.origin}/logo.png`;

    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${isRTL ? "ar" : "en"}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t("shipments.shippingBill")} - ${escapeHtml(
          shipment.trackingNumber,
        )}</title>
        <style>
          :root {
            --ink: #111827;
            --muted: #4b5563;
            --line: #d1d5db;
            --brand: #0f4c81;
            --bg: #f9fafb;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            direction: ${isRTL ? "rtl" : "ltr"};
          }
          .sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            padding: 10mm;
          }
          .header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            background: var(--brand);
            color: #fff;
            padding: 12px 16px;
            border-radius: 10px;
            align-items: center;
          }
          .header-title { margin: 0; font-size: 22px; letter-spacing: 1.2px; }
          .logo { max-width: 180px; width: 100%; height: auto; object-fit: contain; }
          .tracking { font-size: 18px; font-weight: 700; margin-top: 10px; }
          .meta {
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .meta-box {
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px;
            font-size: 12px;
            background: #fff;
          }
          .meta-label { color: var(--muted); display: block; margin-bottom: 2px; }
          .grid {
            margin-top: 12px;
            display: grid;
            grid-template-columns: 1fr 58mm;
            gap: 12px;
          }
          .panel {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 10px;
          }
          .panel-title {
            margin: 0 0 8px;
            font-size: 13px;
            color: var(--brand);
            letter-spacing: 0.6px;
          }
          .row {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 6px;
            font-size: 12px;
            margin-bottom: 6px;
            align-items: start;
          }
          .label { color: var(--muted); font-weight: 600; }
          .value { word-break: break-word; }
          .qr-wrap {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 10px;
            text-align: center;
          }
          .qr-wrap img { width: 170px; height: 170px; object-fit: contain; }
          .qr-caption { font-size: 11px; color: var(--muted); margin-top: 6px; }
          .footer {
            margin-top: 12px;
            border-top: 1px dashed var(--line);
            padding-top: 8px;
            text-align: center;
            color: var(--muted);
            font-size: 11px;
          }
          @media print {
            body { background: #fff; }
            .sheet { width: auto; min-height: auto; margin: 0; padding: 0; }
            @page { size: A4; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <h1 class="header-title">SHIPPING AIR WAYBILL</h1>
              <div class="tracking">${escapeHtml(shipment.trackingNumber)}</div>
            </div>
            <div style="display:flex; align-items:center; justify-content:${isRTL ? "flex-start" : "flex-end"}">
              <img class="logo" src="${logoSrc}" alt="Shipme Logo" />
            </div>
          </div>
          <div style="margin-top:10px; font-size:12px; display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; color:#fff;">
            <div>${t("shipments.createdDate")}: ${escapeHtml(createdDate)}</div>
            <div>${t("status.title")}: ${escapeHtml(t(`status.${shipment.status}`))}</div>
            <div>${t("shipment.shippingCompany")}: ${escapeHtml(shipment.shippingCompany.name)}</div>
          </div>

          <div class="meta">
            <div class="meta-box"><span class="meta-label">${t("shipment.totalCost")}</span>${escapeHtml(shipment.cost.amount.toLocaleString())} ${escapeHtml(shipment.cost.currency)}</div>
            <div class="meta-box"><span class="meta-label">${t("shipment.paymentMethod")}</span>${escapeHtml(t(`shipment.${shipment.cost.paymentMethod}`))}</div>
            <div class="meta-box"><span class="meta-label">${t("package.weight")}</span>${escapeHtml(shipment.package.weight)} kg</div>
          </div>

          <div class="grid">
            <div>
              <div class="panel" style="margin-bottom:10px;">
                <h3 class="panel-title">SHIPPER / ${t("sender.title")}</h3>
                <div class="row"><div class="label">${t("sender.name")}</div><div class="value">${escapeHtml(shipment.sender.name)}</div></div>
                <div class="row"><div class="label">${t("sender.phone")}</div><div class="value">${escapeHtml(shipment.sender.phone)}</div></div>
                <div class="row"><div class="label">${t("sender.address")}</div><div class="value">${escapeHtml(`${shipment.sender.country}, ${shipment.sender.state}, ${shipment.sender.city}, ${shipment.sender.street}`)}</div></div>
              </div>

              <div class="panel" style="margin-bottom:10px;">
                <h3 class="panel-title">CONSIGNEE / ${t("receiver.title")}</h3>
                <div class="row"><div class="label">${t("receiver.name")}</div><div class="value">${escapeHtml(receiver?.name || "-")}</div></div>
                <div class="row"><div class="label">${t("receiver.phone")}</div><div class="value">${escapeHtml(receiver?.phone || "-")}</div></div>
                <div class="row"><div class="label">${t("receiver.address")}</div><div class="value">${escapeHtml(`${receiver?.country || "-"}, ${receiver?.state || "-"}, ${receiver?.city || "-"}, ${receiver?.street || "-"}`)}</div></div>
              </div>

              <div class="panel">
                <h3 class="panel-title">SHIPMENT DETAILS / ${t("package.title")}</h3>
                <div class="row"><div class="label">${t("package.type")}</div><div class="value">${escapeHtml(t(`package.${shipment.package.type}`))}</div></div>
                <div class="row"><div class="label">${t("package.value")}</div><div class="value">${escapeHtml(shipment.package.value)} ${escapeHtml(shipment.package.currency)}</div></div>
                <div class="row"><div class="label">${t("package.description")}</div><div class="value">${escapeHtml(shipment.package.description)}</div></div>
              </div>
            </div>

            <div>
              <div class="qr-wrap">
                <img src="${qrSrc}" alt="QR Code" />
                <div class="qr-caption">Scan for shipment details</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Generated by Shipme - ${escapeHtml(new Date().toLocaleString())}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!selectedShipment) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(generatePrintContent(selectedShipment));
      printWindow.document.close();
      printWindow.print();
      toast.success(t("shipments.printWindowOpened"));
    }
    setIsPrintDialogOpen(false);
  };

  const getCurrentShipmentLocation = (shipment?: Shipment | null) => {
    if (!shipment?.statusHistory?.length) {
      return "";
    }

    const latestLocationEntry = [...shipment.statusHistory]
      .reverse()
      .find((entry) => String(entry.location || "").trim());

    return String(latestLocationEntry?.location || "").trim();
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SY" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            {language === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-3 sm:px-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("nav.shipments")}
        </h1>
      </div>

      {adjustedWeightShipmentsCount > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              {language === "ar"
                ? `تم تعديل وزن ${adjustedWeightShipmentsCount} شحنة من قبل شركة الشحن. تم تمييزها باللون الأصفر.`
                : `${adjustedWeightShipmentsCount} shipment(s) had weight adjusted by the shipping company. They are highlighted in yellow.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-4 sm:flex-wrap">
            <div className="flex-1 relative">
              <Search
                className={`absolute ${
                  isRTL ? "right-3" : "left-3"
                } top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`}
              />
              <Input
                placeholder={t("shipments.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? "pr-10" : "pl-10"} h-11`}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11">
                <SelectValue placeholder={t("shipments.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shipments.allStatuses")}
                </SelectItem>
                <SelectItem value="pending">{t("status.pending")}</SelectItem>
                <SelectItem value="in-transit">
                  {t("status.in-transit")}
                </SelectItem>
                <SelectItem value="delivered">
                  {t("status.delivered")}
                </SelectItem>
                <SelectItem value="cancelled">
                  {t("status.cancelled")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-56 h-11">
                <SelectValue
                  placeholder={
                    language === "ar" ? "فلترة حسب الشركة" : "Filter by company"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "ar" ? "كل الشركات" : "All companies"}
                </SelectItem>
                {companyFilterOptions.map((companyName) => (
                  <SelectItem key={companyName} value={companyName}>
                    {companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-sm">
                {language === "ar" ? "من تاريخ" : "From Date"}
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-sm">
                {language === "ar" ? "إلى تاريخ" : "To Date"}
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearDateFilters}
                className="h-10 w-full"
              >
                <X className="w-4 h-4 mr-2" />
                {language === "ar" ? "مسح التواريخ" : "Clear Dates"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments List */}
      <div className="space-y-3">
        {filteredShipments.map((shipment) => (
          <Card
            key={shipment._id}
            className={`hover:shadow-md transition-shadow ${
              shipment.weightAdjustment?.isAdjusted
                ? "border-amber-300 bg-amber-50/60"
                : ""
            }`}
          >
            <CardContent className="p-4 sm:p-6">
              {/* Mobile Layout */}
              <div className="block sm:hidden space-y-4">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 w-20 flex-shrink-0">
                      <p className="font-bold text-xs text-gray-900 text-center leading-tight line-clamp-2">
                        {shipment.shippingCompany.name}
                      </p>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getCompanyLogoForShipment(shipment) ? (
                          <img
                            src={getCompanyLogoForShipment(shipment)}
                            alt={shipment.shippingCompany.name}
                            className="w-8 h-8 rounded-md object-cover"
                          />
                        ) : (
                          <Truck className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-gray-900 truncate">
                        {shipment.trackingNumber}
                      </h3>
                      <Badge
                        className={`${getStatusColor(
                          shipment.status,
                        )} text-xs mt-1`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.status)}
                          {t(`status.${shipment.status}`)}
                        </div>
                      </Badge>
                      {shipment.weightAdjustment?.isAdjusted && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs mt-1">
                          {language === "ar"
                            ? "تم تعديل الوزن"
                            : "Weight adjusted"}
                        </Badge>
                      )}
                      {shipment.weightAdjustment?.balanceDeduction?.status ===
                        "insufficient-cancelled" && (
                        <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                          {language === "ar"
                            ? "ملغاة بسبب عدم كفاية الرصيد"
                            : "Cancelled due to insufficient balance"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "من:" : "From:"}
                    </span>
                    <span className="text-right">{shipment.sender.name}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "إلى:" : "To:"}
                    </span>
                    <span className="text-right">
                      {shipment.receivers
                        .map((r) => r.name)
                        .join(language === "ar" ? "، " : ", ")}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "تاريخ الإنشاء:" : "Created Date:"}
                    </span>
                    <span className="text-right">
                      {formatDate(shipment.createdAt)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "شركة الشحن:" : "Company:"}
                    </span>
                    <span className="text-right">
                      {shipment.shippingCompany.name}
                    </span>
                  </p>
                  {getCurrentShipmentLocation(shipment) && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">
                        {language === "ar"
                          ? "الموقع الحالي:"
                          : "Current Location:"}
                      </span>
                      <span className="text-right">
                        {getCurrentShipmentLocation(shipment)}
                      </span>
                    </p>
                  )}
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "التكلفة:" : "Cost:"}
                    </span>
                    <span className="text-right font-semibold text-gray-900">
                      {shipment.cost.amount.toLocaleString()}{" "}
                      {shipment.cost.currency}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "التغليف:" : "Packaging:"}
                    </span>
                    <span className="text-right">
                      {shipment.package.packagingRequested
                        ? language === "ar"
                          ? "مفعلة"
                          : "Enabled"
                        : language === "ar"
                          ? "غير مفعلة"
                          : "Disabled"}
                    </span>
                  </p>
                  {shipment.weightAdjustment?.note?.trim() && (
                    <div className="rounded-md bg-rose-50 border border-rose-300 p-2 text-xs text-rose-900">
                      <span className="font-medium">
                        {language === "ar"
                          ? "ملاحظة تصحيح الوزن: "
                          : "Weight adjustment note: "}
                      </span>
                      {shipment.weightAdjustment.note}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(shipment)}
                      className="flex-1 h-10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {language === "ar" ? "عرض" : "View"}
                    </Button>
                    {canTrackShipment(shipment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackShipment(shipment)}
                        className="flex-1 h-10 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {language === "ar" ? "تتبع" : "Track"}
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {canUseShipmentDocuments(shipment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBill(shipment)}
                        className="flex-1 h-10 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        {language === "ar" ? "طباعة" : "Print"}
                      </Button>
                    )}
                    {shipment.status === "pending" &&
                      shipment.cancellationRequest?.status !== "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelShipment(shipment)}
                          className="flex-1 h-10 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          disabled={shipment.status !== "pending"}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      )}
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1 w-24 flex-shrink-0">
                    <p className="font-bold text-sm text-gray-900 text-center leading-tight line-clamp-2">
                      {shipment.shippingCompany.name}
                    </p>
                    {/* صورة الشحنة */}
                    {shipment.packageImageUrl && (
                      <img
                        src={shipment.packageImageUrl}
                        alt={
                          language === "ar" ? "صورة الشحنة" : "Package Image"
                        }
                        className="w-16 h-16 rounded-md object-cover border mb-1"
                        style={{ background: "#f3f4f6" }}
                      />
                    )}
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getCompanyLogoForShipment(shipment) ? (
                        <img
                          src={getCompanyLogoForShipment(shipment)}
                          alt={shipment.shippingCompany.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <Truck className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {shipment.trackingNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar"
                        ? `من ${shipment.sender.name} إلى ${shipment.receivers.map((r) => r.name).join("، ")}`
                        : `From ${shipment.sender.name} to ${shipment.receivers.map((r) => r.name).join(", ")}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusColor(shipment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.status)}
                          {t(`status.${shipment.status}`)}
                        </div>
                      </Badge>
                      {shipment.cancellationRequest?.status === "pending" && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {language === "ar"
                            ? "طلب إلغاء قيد المراجعة"
                            : "Cancellation request pending"}
                        </Badge>
                      )}
                      {shipment.cancellationRequest?.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-800">
                          {language === "ar"
                            ? "تم رفض طلب الإلغاء"
                            : "Cancellation request rejected"}
                        </Badge>
                      )}
                      {shipment.cancellationRequest?.status === "approved" && (
                        <Badge className="bg-green-100 text-green-800">
                          {language === "ar"
                            ? "تمت الموافقة على طلب الإلغاء"
                            : "Cancellation request approved"}
                        </Badge>
                      )}
                      {shipment.editRequest?.status === "pending" && (
                        <Badge className="bg-sky-100 text-sky-800">
                          {language === "ar"
                            ? "طلب تعديل قيد المراجعة"
                            : "Edit request pending"}
                        </Badge>
                      )}
                      {shipment.editRequest?.status === "rejected" && (
                        <Badge className="bg-rose-100 text-rose-800">
                          {language === "ar"
                            ? "تم رفض طلب التعديل"
                            : "Edit request rejected"}
                        </Badge>
                      )}
                      {shipment.editRequest?.status === "approved" && (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {language === "ar"
                            ? "تمت الموافقة على طلب التعديل"
                            : "Edit request approved"}
                        </Badge>
                      )}
                      {shipment.weightAdjustment?.isAdjusted && (
                        <Badge className="bg-amber-100 text-amber-800">
                          {language === "ar"
                            ? "تم تعديل الوزن"
                            : "Weight adjusted"}
                        </Badge>
                      )}
                      {shipment.weightAdjustment?.balanceDeduction?.status ===
                        "insufficient-cancelled" && (
                        <Badge className="bg-red-100 text-red-800">
                          {language === "ar"
                            ? "ملغاة بسبب عدم كفاية الرصيد"
                            : "Cancelled due to insufficient balance"}
                        </Badge>
                      )}
                      {shipment.weightAdjustment?.balanceDeduction?.status ===
                        "deducted" &&
                        Number(
                          shipment.weightAdjustment?.balanceDeduction?.amount ||
                            0,
                        ) > 0 && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {language === "ar"
                              ? `تم خصم ${Number(
                                  shipment.weightAdjustment?.balanceDeduction
                                    ?.amount || 0,
                                ).toLocaleString(
                                  "ar-SY",
                                )} ${shipment.weightAdjustment?.balanceDeduction?.currency || shipment.cost.currency}`
                              : `${Number(
                                  shipment.weightAdjustment?.balanceDeduction
                                    ?.amount || 0,
                                ).toFixed(
                                  2,
                                )} ${shipment.weightAdjustment?.balanceDeduction?.currency || shipment.cost.currency} deducted`}
                          </Badge>
                        )}
                      <span className="text-sm text-gray-500">
                        {formatDate(shipment.createdAt)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {shipment.shippingCompany.name}
                      </span>
                      {getCurrentShipmentLocation(shipment) && (
                        <span className="text-sm text-gray-500">
                          {language === "ar"
                            ? "الموقع الحالي:"
                            : "Current Location:"}{" "}
                          {getCurrentShipmentLocation(shipment)}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {shipment.cost.amount.toLocaleString()}{" "}
                        {shipment.cost.currency}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">
                        {language === "ar" ? "التغليف:" : "Packaging:"}
                      </span>{" "}
                      {shipment.package.packagingRequested
                        ? language === "ar"
                          ? "مفعلة"
                          : "Enabled"
                        : language === "ar"
                          ? "غير مفعلة"
                          : "Disabled"}
                    </div>
                    {shipment.weightAdjustment?.note?.trim() && (
                      <p className="mt-2 text-xs text-rose-900 bg-rose-50 border border-rose-300 rounded-md px-2 py-1">
                        <span className="font-medium">
                          {language === "ar"
                            ? "ملاحظة تصحيح الوزن: "
                            : "Weight adjustment note: "}
                        </span>
                        {shipment.weightAdjustment.note}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(shipment)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {language === "ar" ? "عرض" : "View"}
                  </Button>
                  {canTrackShipment(shipment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrackShipment(shipment)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {language === "ar" ? "تتبع البوليصة" : "Track Shipment"}
                    </Button>
                  )}
                  {canUseShipmentDocuments(shipment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintBill(shipment)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {language === "ar" ? "طباعة" : "Print"}
                    </Button>
                  )}
                  {shipment.status === "pending" &&
                    shipment.cancellationRequest?.status !== "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelShipment(shipment)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                  {canRequestShipmentEdit(shipment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestShipmentEdit(shipment)}
                      className="text-sky-600 hover:text-sky-700"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {language === "ar" ? "طلب تعديل" : "Edit Request"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShipments.length === 0 && (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === "ar" ? "لا توجد شحنات" : "No shipments found"}
            </h3>
            <p className="text-gray-600">
              {language === "ar"
                ? "لم يتم العثور على شحنات تطابق البحث"
                : "No shipments match your search criteria"}
            </p>
          </CardContent>
        </Card>
      )}

      {(totalPages > 1 || page > 1) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-sm text-gray-600">
            {language === "ar"
              ? `الصفحة ${page} من ${totalPages}`
              : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              {language === "ar" ? t("shipment.previous") : t("shipment.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
            >
              {language === "ar" ? t("shipment.next") : t("shipment.next")}
            </Button>
          </div>
        </div>
      )}

      {/* Shipment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "تفاصيل الشحنة" : "Shipment Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.trackingNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-center">
                <Badge
                  className={`${getStatusColor(
                    selectedShipment.status,
                  )} text-base px-4 py-2`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedShipment.status)}
                    {t(`status.${selectedShipment.status}`)}
                  </div>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sender */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === "ar"
                      ? "معلومات المرسل"
                      : "Sender Information"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الاسم:" : "Name:"}
                      </span>{" "}
                      {selectedShipment.sender.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الهاتف:" : "Phone:"}
                      </span>{" "}
                      {selectedShipment.sender.phone || "-"}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "البريد الإلكتروني:" : "Email:"}
                      </span>{" "}
                      {selectedShipment.sender.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "العنوان:" : "Address:"}
                      </span>{" "}
                      {selectedShipment.sender.street || selectedShipment.sender.address || "-"}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "المدينة:" : "City:"}
                      </span>{" "}
                      {selectedShipment.sender.city || "-"}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الدولة:" : "Country:"}
                      </span>{" "}
                      {selectedShipment.sender.country || "-"}
                    </p>
                  </div>
                </div>

                {/* Receivers */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === "ar"
                      ? `معلومات المستلمين (${selectedShipment.receivers.length})`
                      : `Receivers Information (${selectedShipment.receivers.length})`}
                  </h4>
                  <div className="space-y-4 text-sm">
                    {selectedShipment.receivers.map((receiver, idx) => (
                      <div
                        key={idx}
                        className="border-b last:border-b-0 pb-2 last:pb-0"
                      >
                        <p>
                          <span className="font-medium">
                            {language === "ar" ? "الاسم:" : "Name:"}
                          </span>{" "}
                          {receiver.name}
                        </p>
                        <p>
                          <span className="font-medium">
                            {language === "ar" ? "الهاتف:" : "Phone:"}
                          </span>{" "}
                          {receiver.phone}
                        </p>
                        <p>
                          <span className="font-medium">
                            {language === "ar" ? "العنوان:" : "Address:"}
                          </span>{" "}
                          {receiver.street || receiver.address || receiver.country || "-"}
                        </p>
                        <p>
                          <span className="font-medium">
                            {language === "ar" ? "المدينة:" : "City:"}
                          </span>{" "}
                          {receiver.city || "-"}
                        </p>
                        <p>
                          <span className="font-medium">
                            {language === "ar" ? "الدولة:" : "Country:"}
                          </span>{" "}
                          {receiver.country || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {language === "ar" ? "تفاصيل الطرد" : "Package Details"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "النوع:" : "Type:"}
                    </span>{" "}
                    {t(`package.${selectedShipment.package.type}`)}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "الوزن:" : "Weight:"}
                    </span>{" "}
                    {selectedShipment.package.weight || "-"} kg
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "القيمة:" : "Value:"}
                    </span>{" "}
                    {selectedShipment.package.value || "-"}{" "}
                    {selectedShipment.package.currency || ""}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "شركة الشحن:" : "Company:"}
                    </span>{" "}
                    {selectedShipment.shippingCompany.name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "الأبعاد:" : "Dimensions:"}
                    </span>{" "}
                    {(selectedShipment.package.length || selectedShipment.package.width || selectedShipment.package.height)
                      ? `${selectedShipment.package.length || "-"} x ${selectedShipment.package.width || "-"} x ${selectedShipment.package.height || "-"} cm`
                      : selectedShipment.package.dimensions || "-"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "قابل للكسر:" : "Fragile:"}
                    </span>{" "}
                    {selectedShipment.package.fragile ? (language === "ar" ? "نعم" : "Yes") : (language === "ar" ? "لا" : "No")}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "التغليف:" : "Packaging:"}
                    </span>{" "}
                    {selectedShipment.package.packagingRequested
                      ? language === "ar"
                        ? "مفعلة"
                        : "Enabled"
                      : language === "ar"
                        ? "غير مفعلة"
                        : "Disabled"}
                  </p>
                </div>
                <p className="text-sm">
                  <span className="font-medium">
                    {language === "ar" ? "الوصف:" : "Description:"}
                  </span>{" "}
                  {selectedShipment.package.description}
                </p>
              </div>

              {/* Shipping Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {language === "ar" ? "معلومات الشحن" : "Shipping Information"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "التكلفة الإجمالية:" : "Total Cost:"}
                    </span>{" "}
                    {selectedShipment.cost.amount.toLocaleString()}{" "}
                    {selectedShipment.cost.currency}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "طريقة الدفع:" : "Payment Method:"}
                    </span>{" "}
                    {t(`shipment.${selectedShipment.cost.paymentMethod}`)}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "تاريخ الإنشاء:" : "Created Date:"}
                    </span>{" "}
                    {formatDate(selectedShipment.createdAt)}
                  </p>
                  {getCurrentShipmentLocation(selectedShipment) && (
                    <p>
                      <span className="font-medium">
                        {language === "ar"
                          ? "الموقع الحالي:"
                          : "Current Location:"}
                      </span>{" "}
                      {getCurrentShipmentLocation(selectedShipment)}
                    </p>
                  )}
                  {selectedShipment.package.packagingRequested &&
                    typeof selectedShipment.cost.packagingFee !== "undefined" && (
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "رسوم التغليف:" : "Packaging Fee:"}
                      </span>{" "}
                      {selectedShipment.cost.packagingFee.toLocaleString()} {selectedShipment.cost.currency}
                    </p>
                  )}
                </div>
                {selectedShipment.weightAdjustment?.note?.trim() && (
                  <p className="text-sm rounded-md bg-rose-50 border border-rose-300 px-3 py-2 text-rose-900">
                    <span className="font-medium">
                      {language === "ar"
                        ? "ملاحظة تصحيح الوزن: "
                        : "Weight adjustment note: "}
                    </span>
                    {selectedShipment.weightAdjustment.note}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
            {canTrackShipment(selectedShipment) && (
              <Button
                onClick={() =>
                  selectedShipment && handleTrackShipment(selectedShipment)
                }
                className="w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {language === "ar" ? "تتبع البوليصة" : "Track Shipment"}
              </Button>
            )}
            {canUseShipmentDocuments(selectedShipment) && (
              <Button
                onClick={() =>
                  selectedShipment && handlePrintBill(selectedShipment)
                }
                className="w-full sm:w-auto"
              >
                <Printer className="w-4 h-4 mr-2" />
                {language === "ar" ? "طباعة البوليصة" : "Print Bill"}
              </Button>
            )}
            {selectedShipment?.status === "pending" &&
              selectedShipment?.cancellationRequest?.status !== "pending" && (
                <Button
                  variant="destructive"
                  onClick={() =>
                    selectedShipment && handleCancelShipment(selectedShipment)
                  }
                  className="w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === "ar" ? "إلغاء الشحنة" : "Cancel Shipment"}
                </Button>
              )}
            {canRequestShipmentEdit(selectedShipment) && (
              <Button
                variant="outline"
                onClick={() =>
                  selectedShipment &&
                  handleRequestShipmentEdit(selectedShipment)
                }
                className="w-full sm:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {language === "ar"
                  ? "طلب تعديل الشحنة"
                  : "Request Shipment Edit"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Shipment Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {language === "ar"
                ? "طلب إلغاء الشحنة"
                : "Cancel Shipment Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.trackingNumber} -{" "}
              {language === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>{language === "ar" ? "تحذير:" : "Warning:"}</strong>{" "}
                {language === "ar"
                  ? "سيتم إرسال طلب الإلغاء إلى شركة الشحن للمراجعة"
                  : "Cancellation request will be sent to shipping company for review"}
              </p>
            </div>

            <div>
              <Label htmlFor="cancelReason">
                {language === "ar" ? "سبب الإلغاء" : "Cancellation Reason"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "يرجى إدخال سبب إلغاء الشحنة..."
                    : "Please enter reason for cancellation..."
                }
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {language === "ar" ? "العودة" : "Go Back"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelShipment}
              className="w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              {language === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipment Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-700">
              <Pencil className="w-5 h-5" />
              {language === "ar" ? "طلب تعديل الشحنة" : "Shipment Edit Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.trackingNumber} -{" "}
              {language === "ar"
                ? "أدخل سبب التعديل والتفاصيل المطلوبة"
                : "Enter reason and requested changes"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editReason">
                {language === "ar"
                  ? "سبب طلب التعديل"
                  : "Reason for edit request"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="editReason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "مثال: يوجد خطأ في العنوان أو الهاتف"
                    : "Example: Address or phone number is incorrect"
                }
                rows={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="editRequestedChanges">
                {language === "ar" ? "التعديلات المطلوبة" : "Requested changes"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="editRequestedChanges"
                value={editRequestedChanges}
                onChange={(e) => setEditRequestedChanges(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "اكتب التعديلات التي تريد تنفيذها على الشحنة"
                    : "Describe the edits you want to apply to the shipment"
                }
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={confirmEditShipmentRequest}
              className="w-full sm:w-auto"
            >
              <Pencil className="w-4 h-4 mr-2" />
              {language === "ar" ? "إرسال طلب التعديل" : "Submit Edit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "طباعة بوليصة الشحن" : "Print Shipping Bill"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "اختر طريقة الطباعة" : "Choose print method"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={handlePrint} className="w-full justify-start">
              <Printer className="w-4 h-4 mr-2" />
              {language === "ar" ? "طباعة البوليصة" : "Print Bill"}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "ar" ? "تحميل PDF" : "Download PDF"}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPrintDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
