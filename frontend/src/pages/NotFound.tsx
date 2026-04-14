import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFoundPage() {
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === "ar" ? ar : en);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-3">
          <h1 className="text-8xl font-bold text-blue-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            {tr("الصفحة غير موجودة", "Page Not Found")}
          </h2>
          <p className="text-muted-foreground">
            {tr(
              "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
              "The page you're looking for doesn't exist or may have been moved.",
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <a href="/">{tr("العودة للرئيسية", "Return Home")}</a>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            {tr("رجوع", "Go Back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
