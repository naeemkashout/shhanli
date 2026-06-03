import React from "react";

export default function Step4_Package({ ctx }: { ctx: any }) {
  const { t, formData, setFormData } = ctx;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label>{t("package.type")}</label>
          <select value={formData.packageType} onChange={(e)=> setFormData((prev:any)=>({...prev, packageType: e.target.value}))} className="mt-2">
            <option value="documents">{t("package.documents")}</option>
            <option value="electronics">{t("package.electronics")}</option>
            <option value="clothing">{t("package.clothing")}</option>
            <option value="books">{t("package.books")}</option>
            <option value="gifts">{t("package.gifts")}</option>
            <option value="food">{t("package.food")}</option>
            <option value="other">{t("package.other")}</option>
          </select>
        </div>
        <div>
          <label>{t("package.weight")}</label>
          <input type="number" value={formData.weight} onChange={(e)=> setFormData((prev:any)=>({...prev, weight: e.target.value}))} className="mt-2" />
        </div>
      </div>

      <div>
        <label>{t("package.description")}</label>
        <textarea value={formData.description} onChange={(e)=> setFormData((prev:any)=>({...prev, description: e.target.value}))} className="mt-2" />
      </div>
    </div>
  );
}
