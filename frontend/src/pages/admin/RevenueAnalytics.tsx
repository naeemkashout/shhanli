import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import adminService from "@/services/adminService";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  BarChart3,
  Building2,
  DollarSign,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CompanyRevenueRow = {
  companyId: string;
  companyName: string;
  revenue?: {
    USD?: number;
    SYP?: number;
  };
  transactionsCount?: number;
  usersCount?: number;
  shipmentsCount?: number;
};

export default function RevenueAnalytics() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadRevenueAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getDashboardStats(period);
        setStats(data);
      } catch (error: any) {
        toast.error(
          error.message ||
            tr(
              "فشل تحميل تحليلات الإيرادات",
              "Failed to load revenue analytics",
            ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadRevenueAnalytics();
  }, [period, language]);

  const companyRevenue: CompanyRevenueRow[] = Array.isArray(
    stats?.companyRevenue,
  )
    ? stats.companyRevenue
    : [];
  const dailyRevenue = Array.isArray(stats?.dailyRevenue)
    ? stats.dailyRevenue
    : [];
  const totalUsd = Number(stats?.revenue?.USD || 0);
  const totalSyp = Number(stats?.revenue?.SYP || 0);
  const totalTransactions = companyRevenue.reduce(
    (sum, company) => sum + Number(company.transactionsCount || 0),
    0,
  );

  const topUsdCompany = companyRevenue.reduce<CompanyRevenueRow | null>(
    (best, current) => {
      if (!best) return current;
      return Number(current.revenue?.USD || 0) > Number(best.revenue?.USD || 0)
        ? current
        : best;
    },
    null,
  );

  const topSypCompany = companyRevenue.reduce<CompanyRevenueRow | null>(
    (best, current) => {
      if (!best) return current;
      return Number(current.revenue?.SYP || 0) > Number(best.revenue?.SYP || 0)
        ? current
        : best;
    },
    null,
  );

  const usdChartData = companyRevenue.map((company) => ({
    name:
      company.companyName.length > 18
        ? `${company.companyName.slice(0, 18)}...`
        : company.companyName,
    value: Number(company.revenue?.USD || 0),
  }));

  const sypChartData = companyRevenue.map((company) => ({
    name:
      company.companyName.length > 18
        ? `${company.companyName.slice(0, 18)}...`
        : company.companyName,
    value: Number(company.revenue?.SYP || 0),
  }));
  const chartHeight = Math.max(320, companyRevenue.length * 52);

  const formatDayLabel = (dateText: string) => {
    if (!dateText) return "";
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateText;
    return language === "ar"
      ? date.toLocaleDateString("ar-SY", {
          day: "2-digit",
          month: "2-digit",
        })
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
        });
  };

  const formatPercent = (value: number, total: number) => {
    if (!total) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {tr("تحليل إيرادات الشركات", "Company Revenue Analytics")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {tr(
              "صفحة مستقلة لعرض الإيرادات المالية لكل شركة مع مخططات بيانية وتفصيل موسع حسب الفترة الزمنية.",
              "A dedicated page showing financial revenue for each company with charts and expanded analysis by time period.",
            )}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-auto"
        >
          <option value="7">{tr("آخر 7 أيام", "Last 7 days")}</option>
          <option value="30">{tr("آخر 30 يوم", "Last 30 days")}</option>
          <option value="90">{tr("آخر 90 يوم", "Last 90 days")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tr("إجمالي الإيراد بالدولار", "Total Revenue In USD")}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  ${totalUsd.toFixed(2)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tr("إجمالي الإيراد بالليرة", "Total Revenue In SYP")}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalSyp.toLocaleString()} ل.س
                </p>
              </div>
              <div className="rounded-full bg-sky-100 p-3">
                <TrendingUp className="h-8 w-8 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tr("عدد الشركات ذات الإيراد", "Companies With Revenue")}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {companyRevenue.length}
                </p>
              </div>
              <div className="rounded-full bg-violet-100 p-3">
                <Building2 className="h-8 w-8 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tr("عدد العمليات المالية", "Financial Transactions Count")}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalTransactions}
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <ReceiptText className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {tr(
                "الإيراد اليومي بالدولار حسب الأيام",
                "Daily USD Revenue By Day",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDayLabel}
                    minTickGap={20}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => formatDayLabel(String(value))}
                    formatter={(value: number) => [
                      `$${Number(value).toFixed(2)}`,
                      tr("الإيراد", "Revenue"),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="USD"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {tr(
                "الإيراد اليومي بالليرة حسب الأيام",
                "Daily SYP Revenue By Day",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDayLabel}
                    minTickGap={20}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => formatDayLabel(String(value))}
                    formatter={(value: number) => [
                      `${Number(value).toLocaleString()} ل.س`,
                      tr("الإيراد", "Revenue"),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="SYP"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {tr(
                "إيرادات جميع الشركات بالدولار",
                "All Companies Revenue In USD",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[620px] w-full overflow-y-auto">
              <div style={{ height: chartHeight, minWidth: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usdChartData}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={110} />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${Number(value).toFixed(2)}`,
                        tr("الإيراد", "Revenue"),
                      ]}
                    />
                    <Bar dataKey="value" fill="#059669" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {tr(
                "إيرادات جميع الشركات بالليرة",
                "All Companies Revenue In SYP",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[620px] w-full overflow-y-auto">
              <div style={{ height: chartHeight, minWidth: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sypChartData}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={110} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${Number(value).toLocaleString()} ل.س`,
                        tr("الإيراد", "Revenue"),
                      ]}
                    />
                    <Bar dataKey="value" fill="#0284c7" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{tr("أعلى شركة بالدولار", "Top USD Company")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900">
              {topUsdCompany?.companyName || tr("لا يوجد", "None")}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {tr("الإيراد", "Revenue")}: $
              {Number(topUsdCompany?.revenue?.USD || 0).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {tr("الحصة من الإجمالي", "Share of total")}:{" "}
              {formatPercent(
                Number(topUsdCompany?.revenue?.USD || 0),
                totalUsd,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr("أعلى شركة بالليرة", "Top SYP Company")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900">
              {topSypCompany?.companyName || tr("لا يوجد", "None")}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {tr("الإيراد", "Revenue")}:{" "}
              {Number(topSypCompany?.revenue?.SYP || 0).toLocaleString()} ل.س
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {tr("الحصة من الإجمالي", "Share of total")}:{" "}
              {formatPercent(
                Number(topSypCompany?.revenue?.SYP || 0),
                totalSyp,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr("توضيح موسع", "Expanded Explanation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              {tr(
                "هذه الصفحة تجمع الإيرادات المالية المكتملة فقط ضمن الفترة المختارة، وتعرضها لكل شركة شحن على حدة.",
                "This page aggregates only completed financial revenue within the selected period and shows it per shipping company.",
              )}
            </p>
            <p>
              {tr(
                "المخططان العلويان يعرضان الإيراد اليومي حسب الأيام (المحور السفلي = الأيام)، بينما مخططات الشركات أدناه تعرض جميع الشركات دون استثناء.",
                "The top charts show day-by-day revenue (bottom axis = days), while the company charts below include all companies without exclusion.",
              )}
            </p>
            <p>
              {tr(
                "يمكن استخدام هذا العرض لمقارنة الأداء بين الشركات ومتابعة التركّز المالي خلال 7 أو 30 أو 90 يومًا.",
                "This view can be used to compare company performance and track revenue concentration over 7, 30, or 90 days.",
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {tr("تفصيل الإيرادات حسب الشركة", "Revenue Breakdown By Company")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyRevenue.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">
                      {tr("الشركة", "Company")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {tr("عدد العمليات", "Transactions")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {tr("عدد المستخدمين", "Users")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {tr("عدد الشحنات", "Shipments")}
                    </th>
                    <th className="px-4 py-3 font-medium">USD</th>
                    <th className="px-4 py-3 font-medium">
                      {tr("نسبة USD", "USD Share")}
                    </th>
                    <th className="px-4 py-3 font-medium">SYP</th>
                    <th className="px-4 py-3 font-medium">
                      {tr("نسبة SYP", "SYP Share")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companyRevenue.map((company, index) => (
                    <tr key={company.companyId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {company.companyName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {company.transactionsCount || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {company.usersCount || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {company.shipmentsCount || 0}
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">
                        ${Number(company.revenue?.USD || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatPercent(
                          Number(company.revenue?.USD || 0),
                          totalUsd,
                        )}
                      </td>
                      <td className="px-4 py-3 text-sky-700 font-semibold">
                        {Number(company.revenue?.SYP || 0).toLocaleString()} ل.س
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatPercent(
                          Number(company.revenue?.SYP || 0),
                          totalSyp,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-gray-500">
              {tr(
                "لا توجد بيانات إيرادات للشركات ضمن الفترة المحددة",
                "No company revenue data is available for the selected period",
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
