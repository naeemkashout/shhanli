import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ContactUs() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === "ar";

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error(
        isArabic ? "يرجى تعبئة جميع الحقول" : "Please fill all fields",
      );
      return;
    }

    toast.success(
      isArabic
        ? "تم استلام رسالتك، سنتواصل معك قريبًا"
        : "Your message has been received. We will contact you soon.",
    );

    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isArabic ? "تواصل معنا" : "Contact Us"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 bg-blue-50">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Phone className="w-4 h-4" />
              {isArabic ? "الهاتف" : "Phone"}
            </div>
            <p className="mt-2 text-sm text-gray-700" dir="ltr">
              +963 11 000 0000
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-emerald-50">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <Mail className="w-4 h-4" />
              {isArabic ? "البريد الإلكتروني" : "Email"}
            </div>
            <p className="mt-2 text-sm text-gray-700" dir="ltr">
              support@shipme.com
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-amber-50">
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <MessageCircle className="w-4 h-4" />
              {isArabic ? "ساعات العمل" : "Working Hours"}
            </div>
            <p className="mt-2 text-sm text-gray-700">
              {isArabic
                ? "السبت - الخميس، 9:00 صباحًا - 5:00 مساءً"
                : "Sat - Thu, 9:00 AM - 5:00 PM"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "أرسل لنا رسالة" : "Send Us a Message"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">
                  {isArabic ? "الاسم" : "Name"}
                </Label>
                <Input
                  id="contact-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={isArabic ? "اكتب اسمك" : "Enter your name"}
                />
              </div>
              <div>
                <Label htmlFor="contact-email">
                  {isArabic ? "البريد الإلكتروني" : "Email"}
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={
                    isArabic ? "example@email.com" : "example@email.com"
                  }
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact-message">
                {isArabic ? "الرسالة" : "Message"}
              </Label>
              <Textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder={
                  isArabic ? "اكتب رسالتك هنا" : "Write your message here"
                }
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              {isArabic ? "إرسال" : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
