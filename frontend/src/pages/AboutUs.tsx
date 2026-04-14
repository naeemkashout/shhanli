import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, ShieldCheck, Globe2, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutUs() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === "ar";

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <Card className="bg-gradient-to-r from-slate-900 to-blue-900 text-white border-0">
        <CardHeader>
          <Badge className="w-fit bg-white/20 text-white hover:bg-white/20">
            {isArabic ? "من نحن" : "About Us"}
          </Badge>
          <CardTitle className="text-3xl font-bold">
            {isArabic ? "شحنلي" : "Shhanli"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-blue-100 leading-7">
            {isArabic
              ? "منصة شحن متكاملة تربط المستخدمين بشركات الشحن الموثوقة، وتوفر إدارة سهلة للشحنات والمدفوعات والإشعارات في مكان واحد."
              : "An integrated shipping platform that connects users with trusted shipping companies and provides easy shipment, payment, and notification management in one place."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Truck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "خدمة شحن موثوقة" : "Reliable Shipping Service"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic
                    ? "نتعاون مع شركات شحن متنوعة لتوفير خيارات تناسب احتياجك المحلي والدولي."
                    : "We partner with multiple carriers to provide local and international options that fit your needs."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "أمان البيانات" : "Data Security"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic
                    ? "نطبّق أفضل الممارسات لحماية بيانات الحسابات والمعاملات داخل المنصة."
                    : "We apply best practices to protect account and transaction data across the platform."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Globe2 className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "تغطية واسعة" : "Wide Coverage"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic
                    ? "دعم للشحن داخل المدن وخارجها مع تتبع واضح لحالة كل شحنة."
                    : "Support for local and long-distance shipping with clear tracking for each shipment."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Target className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "رؤيتنا" : "Our Vision"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic
                    ? "بناء تجربة شحن ذكية وسهلة تساعد الأفراد والتجار على إدارة عملياتهم بثقة."
                    : "To build a smart and simple shipping experience that helps individuals and merchants operate with confidence."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
