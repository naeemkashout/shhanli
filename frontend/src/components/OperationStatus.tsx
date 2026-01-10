import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type OperationState = "idle" | "loading" | "success" | "error";

interface OperationStatusProps {
  state: OperationState;
  title?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onContinue?: () => void;
  onClose?: () => void;
  showRetry?: boolean;
  showContinue?: boolean;
  showClose?: boolean;
  className?: string;
}

export default function OperationStatus({
  state,
  title,
  loadingMessage = "جاري المعالجة...",
  successMessage = "تمت العملية بنجاح",
  errorMessage = "حدث خطأ أثناء العملية",
  onRetry,
  onContinue,
  onClose,
  showRetry = true,
  showContinue = true,
  showClose = true,
  className = "",
}: OperationStatusProps) {
  const { t, isRTL, language } = useLanguage();
  if (state === "idle") return null;

  const getIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-600" />;
    }
  };

  const getMessage = () => {
    switch (state) {
      case "loading":
        return loadingMessage;
      case "success":
        return successMessage;
      case "error":
        return errorMessage;
      default:
        return "";
    }
  };

  const getBackgroundColor = () => {
    switch (state) {
      case "loading":
        return "bg-blue-50 border-blue-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <Card className={`w-full max-w-md ${getBackgroundColor()}`}>
        <CardContent className="p-8 text-center">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {title}
            </h3>
          )}

          <div className="flex justify-center mb-6">{getIcon()}</div>

          <p className="text-gray-700 mb-6 text-lg">{getMessage()}</p>

          <div className="flex gap-3 justify-center">
            {state === "error" && showRetry && onRetry && (
              <Button onClick={onRetry} variant="outline">
                إعادة المحاولة
              </Button>
            )}

            {state === "success" && showContinue && onContinue && (
              <Button onClick={onContinue}>
                <ArrowRight className="w-4 h-4 mr-2" />
                {t("common.confirm")}
              </Button>
            )}

            {(state === "error" || state === "success") &&
              showClose &&
              onClose && (
                <Button
                  onClick={onClose}
                  variant={state === "success" ? "outline" : "default"}
                >
                  {t("common.close")}
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
