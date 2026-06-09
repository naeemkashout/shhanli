export const statusColorMap: Record<string, string> = {
  pending: "bg-cyan-100 text-cyan-800",
  confirmed: "bg-sky-100 text-sky-800",
  "picked-up": "bg-violet-100 text-violet-800",
  "in-transit": "bg-blue-100 text-blue-800",
  "out-for-delivery": "bg-orange-100 text-orange-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-slate-200 text-slate-800",
};

export const getStatusColor = (status: string) => {
  return statusColorMap[status] || "bg-gray-100 text-gray-800";
};
