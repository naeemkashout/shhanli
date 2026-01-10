import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  Eye,
  Printer,
  Download,
  MapPin,
  Calendar,
  User,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Shipment {
  id: string;
  trackingNumber: string;
  sender: {
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderCountry: string;
    senderState: string;
    senderCity: string;
    senderStreet: string;
    senderType: "individual" | "merchant";
    senderCompanyName?: string;
    senderCommercialRegister?: string;
  };
  receiver: {
    receiverName: string;
    receiverPhone: string;
    receiverEmail: string;
    receiverCountry: string;
    receiverState: string;
    receiverCity: string;
    receiverStreet: string;
  };
  package: {
    type: string;
    weight: number;
    description: string;
    value: number;
    currency: string;
  };
  status: "pending" | "in-transit" | "delivered" | "cancelled";
  company: string;
  cost: number;
  createdAt: string;
  estimatedDelivery: string;
  paymentMethod: string;
}

export default function Shipments() {
  const { t, isRTL, language } = useLanguage();

  // Dynamic mock shipments based on language
  const getMockShipments = (): Shipment[] => [
    {
      id: "1",
      trackingNumber: "SH001234567",
      sender: {
        senderName: language === "ar" ? "أحمد محمد" : "Ahmed Mohammed",
        senderCountry: "Syria",
        senderState: "Aleppo",
        senderEmail: "naeem@gmail.com",
        senderPhone: "+963991234567",
        senderType: "individual",
        senderStreet:
          language === "ar"
            ? "شارع الملك فيصل، حي السلامانية"
            : "King Faisal Street, Salamaniya District",
        senderCity: language === "ar" ? "حلب" : "Aleppo",
      },
      receiver: {
        receiverName: language === "ar" ? "فاطمة علي" : "Fatima Ali",
        receiverPhone: "+963987654321",
        receiverCountry: "UAE",
        receiverState: "Dubai",
        receiverEmail: "user@gmail.com",

        receiverStreet:
          language === "ar"
            ? "شارع النور، حي الحرة"
            : "Al-Nour Street, Al-Harra District",
        receiverCity: language === "ar" ? "دمشق" : "Damascus",
      },
      package: {
        type: "electronics",
        weight: 2.5,
        description:
          language === "ar" ? "جهاز كمبيوتر محمول" : "Laptop computer",
        value: 800,
        currency: "USD",
      },
      status: "delivered",
      company: language === "ar" ? "أرامكس" : "Aramex",
      cost: 12500,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-17",
      paymentMethod: "wallet",
    },
    {
      id: "2",
      trackingNumber: "SH001234568",
      sender: {
        senderName: language === "ar" ? "Naeem" : "Naeem",
        senderCountry: "Syria",
        senderState: "daraa",
        senderEmail: "naeem@gmail.com",
        senderPhone: "+963991234567",
        senderType: "individual",
        senderStreet:
          language === "ar"
            ? "شارع الملك فيصل، حي السلامانية"
            : "King Faisal Street, Salamaniya District",
        senderCity: language === "ar" ? "حلب" : "Daraa",
      },
      receiver: {
        receiverName: language === "ar" ? "فاطمة علي" : "Fatima Ali",
        receiverPhone: "+963987654321",
        receiverCountry: "UAE",
        receiverState: "Dubai",
        receiverEmail: "user@gmail.com",

        receiverStreet:
          language === "ar"
            ? "شارع النور، حي الحرة"
            : "Al-Nour Street, Al-Harra District",
        receiverCity: language === "ar" ? "دمشق" : "Damascus",
      },
      package: {
        type: "documents",
        weight: 0.5,
        description: language === "ar" ? "وثائق مهمة" : "Important documents",
        value: 50,
        currency: "USD",
      },
      status: "in-transit",
      company: "DHL",
      cost: 4000,
      createdAt: "2024-01-14",
      estimatedDelivery: "2024-01-16",
      paymentMethod: "shamCash",
    },
    {
      id: "3",
      trackingNumber: "SH001234569",
      sender: {
        senderName: language === "ar" ? "أحمد محمد" : "Ahmed Mohammed",
        senderCountry: "Syria",
        senderState: "Aleppo",
        senderEmail: "naeem@gmail.com",
        senderPhone: "+963991234567",
        senderType: "individual",
        senderStreet:
          language === "ar"
            ? "شارع الملك فيصل، حي السلامانية"
            : "King Faisal Street, Salamaniya District",
        senderCity: language === "ar" ? "حلب" : "Aleppo",
      },
      receiver: {
        receiverName: language === "ar" ? "فاطمة علي" : "Fatima Ali",
        receiverPhone: "+963987654321",
        receiverCountry: "UAE",
        receiverState: "Dubai",
        receiverEmail: "user@gmail.com",

        receiverStreet:
          language === "ar"
            ? "شارع النور، حي الحرة"
            : "Al-Nour Street, Al-Harra District",
        receiverCity: language === "ar" ? "دمشق" : "Damascus",
      },
      package: {
        type: "clothing",
        weight: 1.2,
        description: language === "ar" ? "ملابس شتوية" : "Winter clothes",
        value: 200,
        currency: "USD",
      },
      status: "pending",
      company: language === "ar" ? "سوريا إكسبريس" : "Syria Express",
      cost: 3600,
      createdAt: "2024-01-13",
      estimatedDelivery: "2024-01-15",
      paymentMethod: "cod",
    },
  ];

  const [shipments, setShipments] = useState<Shipment[]>(getMockShipments());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in-transit":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "in-transit":
        return <Truck className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Get tracking URL based on shipping company
  const getTrackingUrl = (company: string, trackingNumber: string) => {
    const companyName = company.toLowerCase();

    if (companyName.includes("aramex") || companyName.includes("أرامكس")) {
      return `https://www.aramex.com/us/en/track/shipments?ShipmentNumber=${trackingNumber}`;
    } else if (companyName.includes("dhl")) {
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${trackingNumber}`;
    } else if (companyName.includes("fedex")) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    } else if (companyName.includes("ups")) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    } else if (companyName.includes("syria") || companyName.includes("سوريا")) {
      return `https://syriaexpress.sy/tracking?number=${trackingNumber}`;
    } else {
      // Generic tracking URL for other companies
      return `https://www.google.com/search?q=track+${encodeURIComponent(
        company
      )}+${trackingNumber}`;
    }
  };

  const handleTrackShipment = (shipment: Shipment) => {
    const trackingUrl = getTrackingUrl(
      shipment.company,
      shipment.trackingNumber
    );
    window.open(trackingUrl, "_blank");
    toast.success(
      language === "ar"
        ? `تم فتح صفحة تتبع الشحنة ${shipment.trackingNumber}`
        : `Tracking page opened for shipment ${shipment.trackingNumber}`
    );
  };

  // Filter shipments based on search term, status, and date range
  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.trackingNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.sender.senderName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.receiver.receiverName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;

    // Date filtering
    const shipmentDate = new Date(shipment.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDateFrom = !fromDate || shipmentDate >= fromDate;
    const matchesDateTo = !toDate || shipmentDate <= toDate;
    const matchesDate = matchesDateFrom && matchesDateTo;

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const confirmCancelShipment = () => {
    if (!selectedShipment || !cancelReason.trim()) {
      toast.error(t("shipments.enterCancelReason"));
      return;
    }

    // Update shipment status to cancelled
    setShipments((prev) =>
      prev.map((shipment) =>
        shipment.id === selectedShipment.id
          ? { ...shipment, status: "cancelled" as const }
          : shipment
      )
    );

    toast.success(
      t("shipments.cancelRequestSent", {
        trackingNumber: selectedShipment.trackingNumber,
      })
    );
    setIsCancelDialogOpen(false);
    setSelectedShipment(null);
    setCancelReason("");
  };

  // Generate PDF for shipment
  const generatePDF = (shipment: Shipment) => {
    const doc = new jsPDF();

    // Set document direction for RTL languages
    if (isRTL) {
      doc.setFont("helvetica", "normal");
      doc.setR2L(true);
    }

    // Title
    doc.setFontSize(20);
    doc.text(t("shipments.shippingBill"), 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `${t("shipments.trackingNumber")}: ${shipment.trackingNumber}`,
      14,
      30
    );

    // Sender Information
    doc.setFontSize(14);
    doc.text(t("sender.title"), 14, 45);
    doc.setFontSize(10);
    doc.text(`${t("sender.name")}: ${shipment.sender.senderName}`, 14, 55);
    doc.text(`${t("sender.phone")}: ${shipment.sender.senderPhone}`, 14, 60);
    doc.text(
      `${t("sender.address")}: ${shipment.sender.senderStreet}, ${
        shipment.sender.senderCity
      }, ${shipment.sender.senderState}, ${shipment.sender.senderCountry}`,
      14,
      65
    );

    // Receiver Information
    doc.setFontSize(14);
    doc.text(t("receiver.title"), 14, 80);
    doc.setFontSize(10);
    doc.text(
      `${t("receiver.name")}: ${shipment.receiver.receiverName}`,
      14,
      90
    );
    doc.text(
      `${t("receiver.phone")}: ${shipment.receiver.receiverPhone}`,
      14,
      95
    );
    doc.text(
      `${t("receiver.address")}: ${shipment.receiver.receiverStreet}, ${
        shipment.receiver.receiverCity
      }, ${shipment.receiver.receiverState}, ${
        shipment.receiver.receiverCountry
      }`,
      14,
      100
    );

    // Package Details
    doc.setFontSize(14);
    doc.text(t("package.title"), 14, 115);
    doc.setFontSize(10);
    doc.text(
      `${t("package.type")}: ${t(`package.${shipment.package.type}`)}`,
      14,
      125
    );
    doc.text(`${t("package.weight")}: ${shipment.package.weight} kg`, 14, 130);
    doc.text(
      `${t("package.value")}: ${shipment.package.value} ${
        shipment.package.currency
      }`,
      14,
      135
    );
    doc.text(
      `${t("package.description")}: ${shipment.package.description}`,
      14,
      140
    );

    // Shipping Information
    doc.setFontSize(14);
    doc.text(t("shipment.shippingInfo"), 14, 155);
    doc.setFontSize(10);
    doc.text(`${t("shipment.shippingCompany")}: ${shipment.company}`, 14, 165);
    doc.text(
      `${t("shipment.totalCost")}: ${shipment.cost.toLocaleString()} SYP`,
      14,
      170
    );
    doc.text(
      `${t("shipment.paymentMethod")}: ${t(
        `shipment.${shipment.paymentMethod}`
      )}`,
      14,
      175
    );
    doc.text(`${t("shipments.createdDate")}: ${shipment.createdAt}`, 14, 180);
    doc.text(
      `${t("shipments.estimatedDelivery")}: ${shipment.estimatedDelivery}`,
      14,
      185
    );
    doc.text(
      `${t("status.title")}: ${t(`status.${shipment.status}`)}`,
      14,
      190
    );

    // Footer
    doc.setFontSize(8);
    doc.text(
      `Generated by Shply - ${new Date().toLocaleDateString()}`,
      105,
      280,
      { align: "center" }
    );

    // Save PDF
    doc.save(`Shipping-Bill-${shipment.trackingNumber}.pdf`);
  };

  const handleDownloadPDF = () => {
    if (!selectedShipment) return;

    try {
      generatePDF(selectedShipment);
      toast.success(
        language === "ar"
          ? `تم تحميل البوليصة ${selectedShipment.trackingNumber} كملف PDF`
          : `Shipment bill ${selectedShipment.trackingNumber} downloaded as PDF`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        language === "ar"
          ? "حدث خطأ أثناء تحميل ملف PDF"
          : "Error generating PDF file"
      );
    }
    setIsPrintDialogOpen(false);
  };

  const generatePrintContent = (shipment: Shipment) => {
    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${isRTL ? "ar" : "en"}">
      <head>
        <meta charset="UTF-8">
        <title>${t("shipments.shippingBill")} - ${
      shipment.trackingNumber
    }</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; direction: ${
            isRTL ? "rtl" : "ltr"
          }; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .info-label { font-weight: bold; }
          .tracking-number { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شحنلي</h1>
          <h2>شحنلي</h2>
          <div class="tracking-number">${shipment.trackingNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("sender.title")} - ${
      language === "ar" ? "Sender Information" : "معلومات المرسل"
    }</div>
          <div class="info-row">
            <span class="info-label">${t("sender.name")} - ${
      language === "ar" ? "Name" : "الاسم"
    }:</span>
            <span>${shipment.sender.senderName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("sender.phone")} - ${
      language === "ar" ? "Phone" : "الهاتف"
    }:</span>
            <span>${shipment.sender.senderPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("sender.address")} - ${
      language === "ar" ? "Address" : "العنوان"
    }:</span>
            <span>${shipment.sender.senderCountry},${
      shipment.sender.senderState
    },${shipment.sender.senderCity}, ${shipment.sender.senderStreet}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("receiver.title")} - ${
      language === "ar" ? "Receiver Information" : "معلومات المستقبل"
    }</div>
          <div class="info-row">
            <span class="info-label">${t("sender.name")} - ${
      language === "ar" ? "Name" : "الاسم"
    }:</span>
            <span>${shipment.receiver.receiverName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("sender.phone")} - ${
      language === "ar" ? "Phone" : "الهاتف"
    }:</span>
            <span>${shipment.receiver.receiverPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("sender.address")} - ${
      language === "ar" ? "Address" : "العنوان"
    }:</span>
            <span>${shipment.receiver.receiverCountry}, ${
      shipment.receiver.receiverState
    }, ${shipment.receiver.receiverCity}, ${
      shipment.receiver.receiverStreet
    }</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("package.title")} - ${
      language === "ar" ? "Package Details" : "تفاصيل الطرد"
    }</div>
          <div class="info-row">
            <span class="info-label">${t("package.type")} - ${
      language === "ar" ? "Type" : "النوع"
    }:</span>
            <span>${t(`package.${shipment.package.type}`)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("package.weight")} - ${
      language === "ar" ? "Weight" : "الوزن"
    }:</span>
            <span>${shipment.package.weight} kg</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("package.description")} - ${
      language === "ar" ? "Description" : "الوصف"
    }:</span>
            <span>${shipment.package.description}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("package.value")} - ${
      language === "ar" ? "Value" : "القيمة"
    }:</span>
            <span>${shipment.package.value} ${shipment.package.currency}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("shipment.shippingInfo")} - ${
      language === "ar" ? "Shipping Information" : "معلومات الشحن"
    }</div>
          <div class="info-row">
            <span class="info-label">${t("shipment.shippingCompany")} - ${
      language === "ar" ? "Company" : "شركة الشحن"
    }:</span>
            <span>${shipment.company}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("shipment.totalCost")} - ${
      language === "ar" ? "Cost" : "التكلفة"
    }:</span>
            <span>${shipment.cost.toLocaleString()} SYP</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("shipment.paymentMethod")} - ${
      language === "ar" ? "Payment" : "طريقة الدفع"
    }:</span>
            <span>${t(`shipment.${shipment.paymentMethod}`)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("shipments.createdDate")} - ${
      language === "ar" ? "Created" : "تاريخ الإنشاء"
    }:</span>
            <span>${shipment.createdAt}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${t("shipments.estimatedDelivery")} - ${
      language === "ar" ? "Estimated Delivery" : "التسليم المتوقع"
    }:</span>
            <span>${shipment.estimatedDelivery}</span>
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

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-4 px-3 sm:px-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("nav.shipments")}
        </h1>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-4">
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
          <Card key={shipment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              {/* Mobile Layout */}
              <div className="block sm:hidden space-y-4">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-gray-900 truncate">
                        {shipment.trackingNumber}
                      </h3>
                      <Badge
                        className={`${getStatusColor(
                          shipment.status
                        )} text-xs mt-1`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.status)}
                          {t(`status.${shipment.status}`)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "من:" : "From:"}
                    </span>
                    <span className="text-right">
                      {shipment.sender.senderName}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "إلى:" : "To:"}
                    </span>
                    <span className="text-right">
                      {shipment.receiver.receiverName}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "تاريخ الإنشاء:" : "Created Date:"}
                    </span>
                    <span className="text-right">{shipment.createdAt}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "شركة الشحن:" : "Company:"}
                    </span>
                    <span className="text-right">{shipment.company}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">
                      {language === "ar" ? "التكلفة:" : "Cost:"}
                    </span>
                    <span className="text-right font-semibold text-gray-900">
                      {shipment.cost.toLocaleString()} SYP
                    </span>
                  </p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrackShipment(shipment)}
                      className="flex-1 h-10 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {language === "ar" ? "تتبع" : "Track"}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintBill(shipment)}
                      className="flex-1 h-10 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {language === "ar" ? "طباعة" : "Print"}
                    </Button>
                    {shipment.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelShipment(shipment)}
                        className="flex-1 h-10 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
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
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {shipment.trackingNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar"
                        ? `من ${shipment.sender.senderName} إلى ${shipment.receiver.receiverName}`
                        : `From ${shipment.sender.senderName} to ${shipment.receiver.receiverName}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusColor(shipment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.status)}
                          {t(`status.${shipment.status}`)}
                        </div>
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {shipment.createdAt}
                      </span>
                      <span className="text-sm text-gray-500">
                        {shipment.company}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {shipment.cost.toLocaleString()} SYP
                      </span>
                    </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrackShipment(shipment)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {language === "ar" ? "تتبع البوليصة" : "Track Shipment"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintBill(shipment)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    {language === "ar" ? "طباعة" : "Print"}
                  </Button>
                  {shipment.status === "pending" && (
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
                    selectedShipment.status
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
                      {selectedShipment.sender.senderName}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الهاتف:" : "Phone:"}
                      </span>{" "}
                      {selectedShipment.sender.senderPhone}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "العنوان:" : "Address:"}
                      </span>{" "}
                      {selectedShipment.sender.senderCountry}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "المدينة:" : "City:"}
                      </span>{" "}
                      {selectedShipment.sender.senderCity}
                    </p>
                  </div>
                </div>

                {/* Receiver */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === "ar"
                      ? "معلومات المستلم"
                      : "Receiver Information"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الاسم:" : "Name:"}
                      </span>{" "}
                      {selectedShipment.receiver.receiverName}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "الهاتف:" : "Phone:"}
                      </span>{" "}
                      {selectedShipment.receiver.receiverPhone}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "العنوان:" : "Address:"}
                      </span>{" "}
                      {selectedShipment.receiver.receiverCountry}
                    </p>
                    <p>
                      <span className="font-medium">
                        {language === "ar" ? "المدينة:" : "City:"}
                      </span>{" "}
                      {selectedShipment.receiver.receiverCity}
                    </p>
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
                    {selectedShipment.package.weight} kg
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "القيمة:" : "Value:"}
                    </span>{" "}
                    {selectedShipment.package.value}{" "}
                    {selectedShipment.package.currency}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "شركة الشحن:" : "Company:"}
                    </span>{" "}
                    {selectedShipment.company}
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
                    {selectedShipment.cost.toLocaleString()} SYP
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "طريقة الدفع:" : "Payment Method:"}
                    </span>{" "}
                    {t(`shipment.${selectedShipment.paymentMethod}`)}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar" ? "تاريخ الإنشاء:" : "Created Date:"}
                    </span>{" "}
                    {selectedShipment.createdAt}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === "ar"
                        ? "التسليم المتوقع:"
                        : "Estimated Delivery:"}
                    </span>{" "}
                    {selectedShipment.estimatedDelivery}
                  </p>
                </div>
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
            <Button
              onClick={() =>
                selectedShipment && handleTrackShipment(selectedShipment)
              }
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === "ar" ? "تتبع البوليصة" : "Track Shipment"}
            </Button>
            <Button
              onClick={() =>
                selectedShipment && handlePrintBill(selectedShipment)
              }
              className="w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 mr-2" />
              {language === "ar" ? "طباعة البوليصة" : "Print Bill"}
            </Button>
            {selectedShipment?.status === "pending" && (
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
