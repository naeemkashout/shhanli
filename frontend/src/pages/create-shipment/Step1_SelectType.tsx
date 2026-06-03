import React from "react";
import { MapPin, Globe } from "lucide-react";

export default function Step1_SelectType({ ctx }: { ctx: any }) {
  const { t, isRTL, allowedShippingTypes, shippingType, setShippingType, shippingCompanies, isBalanceLoading, userBalance, formatAmount } = ctx;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t("shipment.selectShippingType")}</h3>
        <p className="text-gray-600">{t("shipment.selectShippingTypeDesc")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto md:grid-cols-2">
        {allowedShippingTypes.map((type: any) => {
          const isSelected = shippingType === type;
          const isLocal = type === "local";

          return (
            <div
              key={type}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setShippingType(type)}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLocal ? "bg-blue-100" : "bg-green-100"}`}>
                  {isLocal ? <MapPin className="w-8 h-8 text-blue-600" /> : <Globe className="w-8 h-8 text-green-600" />}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{isLocal ? t("shipment.local") : t("shipment.international")}</h4>
                <p className="text-gray-600 text-sm mb-3">{isLocal ? t("shipment.localDesc") : t("shipment.internationalDesc")}</p>
                <p className="text-sm font-medium text-blue-600">
                  {shippingCompanies.filter((company: any) => (isLocal ? company.supportsLocal : company.supportsInternational)).length} {t("shipment.companiesAvailable")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isLocal
                    ? isBalanceLoading
                      ? "جاري تحميل الرصيد..."
                      : `${formatAmount(userBalance.USD, "USD")} | ${formatAmount(userBalance.SYP, "SYP")}`
                    : isRTL
                    ? "الدفع بالدولار الأمريكي"
                    : "Payment in US Dollar"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
