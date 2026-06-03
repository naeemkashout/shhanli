import React from "react";

export default function Step6_Review({ ctx }: { ctx: any }) {
  const { t, formData, receivers, getSelectedCompany, getCodFee, getPackagingFee, formatAmount, handleSubmit, submitting } = ctx;

  const company = getSelectedCompany();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{t("shipment.reviewTitle")}</h3>

      <div className="p-4 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <h4 className="font-medium">{t("sender.title")}</h4>
            <p className="text-sm">{formData.senderName} — {formData.senderPhone}</p>
          </div>
          <div>
            <h4 className="font-medium">{t("package.summary")}</h4>
            <p className="text-sm">{formData.packageType} • {formData.weight} kg</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg">
        <h4 className="font-medium mb-2">{t("shipment.selectedCompany")}</h4>
        {company ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full" />
            <div>
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-gray-600">{company.email}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">{t("shipment.noCompanySelected")}</div>
        )}
      </div>

      <div className="p-4 bg-white rounded-lg">
        <h4 className="font-medium mb-2">{t("shipment.costBreakdown")}</h4>
        <div className="text-sm grid grid-cols-2 gap-2">
          <div>{t("shipment.shippingFee")}</div>
          <div className="text-right">{formatAmount(formData.shippingFee, formData.currency)}</div>
          <div>{t("shipment.codFee")}</div>
          <div className="text-right">{formatAmount(getCodFee(), formData.currency)}</div>
          <div>{t("shipment.packagingFee")}</div>
          <div className="text-right">{formatAmount(getPackagingFee(), formData.currency)}</div>
          <div className="font-semibold">{t("shipment.total")}</div>
          <div className="text-right font-semibold">{formatAmount(formData.totalAmount, formData.currency)}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
          {submitting ? t("common.submitting") : t("shipment.sendShipment")}
        </button>
      </div>
    </div>
  );
}
