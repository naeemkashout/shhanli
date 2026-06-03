import React from "react";
import { User, Building } from "lucide-react";

export default function Step2_Sender({ ctx }: { ctx: any }) {
  const { t, isRTL, formData, setFormData, selectedSenderContactId, setSelectedSenderContactId, senderContactSearch, setSenderContactSearch, getAvailableContacts, filterContactsBySearch, getClientTypeIcon, getClientTypeLabel, NEW_CONTACT_OPTION, handleContactSelect } = ctx;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label className="text-sm">{t("sender.selectFromContacts")}</label>
        <p className="text-xs text-amber-700 mt-1">{isRTL ? "ملاحظة: عند اختيار عميل بدولة غير سورية سيتم ضبط الدولة تلقائيا إلى سوريا للشحن المحلي." : "Note: When selecting a client from a country other than Syria, the country will be automatically set to Syria for local shipping."}</p>
        {/* The Select component markup is retained in parent; for split we only keep illustrative UI here. */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label>{t("sender.name")} <span className="text-red-500">{t("common.required")}</span></label>
          <input value={formData.senderName} onChange={(e) => setFormData((prev:any)=>({...prev, senderName: e.target.value}))} className="mt-2" />
        </div>
        <div>
          <label>{t("sender.phone")} <span className="text-red-500">{t("common.required")}</span></label>
          <input value={formData.senderPhone} onChange={(e) => setFormData((prev:any)=>({...prev, senderPhone: e.target.value}))} className="mt-2" />
        </div>
        <div>
          <label>{t("sender.email")}</label>
          <input value={formData.senderEmail} onChange={(e) => setFormData((prev:any)=>({...prev, senderEmail: e.target.value}))} className="mt-2" />
        </div>
        <div>
          <label>{t("client.type")}</label>
          <select value={formData.senderClientType} onChange={(e)=> setFormData((prev:any)=>({...prev, senderClientType: e.target.value}))} className="mt-2">
            <option value="individual">{t("client.individual")}</option>
            <option value="merchant">{t("client.merchant")}</option>
          </select>
        </div>
      </div>

    </div>
  );
}
