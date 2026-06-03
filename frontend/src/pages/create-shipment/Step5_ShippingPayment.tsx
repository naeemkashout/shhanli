import React from "react";

export default function Step5_ShippingPayment({ ctx }: { ctx: any }) {
  const { t, formData, setFormData, getAvailableCompanies, handleCompanyCardClick, getSelectedCompany, estimatedCost, getCodFee, getPackagingFee, formatAmount, userBalance, isBalanceLoading } = ctx;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-base font-medium">{t("shipment.shippingCompany")} <span className="text-red-500">{t("common.required")}</span></label>
        <p className="mt-2 text-xs text-slate-500">اضغط مطولا على بطاقة الشركة لعرض معلومات الشركة بالكامل.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {getAvailableCompanies().map((company: any) => (
            <div key={company._id} className={`p-4 border-2 rounded-lg cursor-pointer ${formData.shippingCompany === company._id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`} onClick={()=> handleCompanyCardClick(company)}>
              <div className="flex items-center gap-3">
                <div>{company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="h-10 w-10 rounded-full" /> : <div className="h-10 w-10 bg-slate-100"/>}</div>
                <div>
                  <h3 className="font-medium">{company.name}</h3>
                  <p className="text-sm text-gray-600">{estimatedCost>0 ? formatAmount(estimatedCost, formData.currency) : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
