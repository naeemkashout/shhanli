import React from "react";
import { Users, Trash2, Plus } from "lucide-react";

export default function Step3_Receivers({ ctx }: { ctx: any }) {
  const { t, receivers, addReceiver, removeReceiver, updateReceiver } = ctx;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">{t("receiver.titlePlural")} ({receivers.length})</h3>
        </div>
      </div>

      {receivers.map((receiver: any, index: number) => (
        <div key={receiver.id} className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">{t("receiver.number", { number: index + 1 })}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">{t("sender.name")}:</span><span className="font-medium">{receiver.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">{t("sender.phone")}:</span><span className="font-medium">{receiver.phone}</span></div>
          </div>
        </div>
      ))}

      <div>
        <button onClick={addReceiver} className="btn">{t("common.addReceiver")}</button>
      </div>
    </div>
  );
}
