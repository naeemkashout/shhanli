import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Plus,
  Minus,
  Banknote,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import walletService from "@/services/walletService";
import { io, Socket } from "socket.io-client";

type Currency = "SYP" | "USD";
type DepositProvider = "syriatel-cash" | "paymera";

export default function Balance() {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [balanceSYP, setBalanceSYP] = useState(0);
  const [balanceUSD, setBalanceUSD] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<Currency>("SYP");
  const [withdrawCurrency, setWithdrawCurrency] = useState<Currency>("SYP");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [activePaymentId, setActivePaymentId] = useState("");
  const [activeDepositProvider, setActiveDepositProvider] =
    useState<DepositProvider>("paymera");
  const [depositProvider, setDepositProvider] =
    useState<DepositProvider>("paymera");
  const [depositOtp, setDepositOtp] = useState("");
  const [depositStatusText, setDepositStatusText] = useState("");
  const [isCheckingDeposit, setIsCheckingDeposit] = useState(false);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isResendingDepositOtp, setIsResendingDepositOtp] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [showBalanceUsd, setShowBalanceUsd] = useState(true);
  const [showBalanceSyp, setShowBalanceSyp] = useState(true);

  useEffect(() => {
    loadBalanceData();
  }, []);

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!userId) return;

    const apiBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
    });

    socket.on("new-notification", (notification: any) => {
      if (notification?.type === "wallet") {
        loadBalanceData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const loadBalanceData = async () => {
    try {
      const response = await walletService.getBalance();
      const balance = response?.balance || {};
      setBalanceSYP(Number(balance.SYP) || 0);
      setBalanceUSD(Number(balance.USD) || 0);
    } catch (error: any) {
      toast.error(error.message || t("balance.loadError"));
    }
  };

  const withdrawMethods = [
    {
      value: "bank-transfer",
      label: t("balance.bankTransfer"),
      icon: Banknote,
    },
    { value: "mobile-payment", label: t("mobileWallet"), icon: Smartphone },
  ];

  const formatAmountUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatAmountSYP = (amount: number) => {
    return (
      new Intl.NumberFormat(isRTL ? "ar-SY" : "en-US").format(amount) +
      " " +
      t("currency.syp")
    );
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === "SYP") {
      return `${amount.toLocaleString(isRTL ? "ar-SY" : "en-US")} ${t("syrianPoundSymbol")}`;
    }
    return `${t("dollarSymbol")}${amount.toFixed(2)}`;
  };

  const getMinDepositAmount = (currency: Currency) => {
    return currency === "SYP" ? 50000 : 10;
  };

  const getMaxDepositAmount = (currency: Currency) => {
    return currency === "SYP" ? 50000000 : 10000;
  };

  const getMinWithdrawAmount = (currency: Currency) => {
    return currency === "SYP" ? 100000 : 50;
  };

  const getCurrentBalance = (currency: Currency) => {
    return currency === "SYP" ? balanceSYP : balanceUSD;
  };

  const resetDepositFlow = () => {
    setDepositAmount("");
    setActivePaymentId("");
    setActiveDepositProvider("paymera");
    setDepositOtp("");
    setDepositStatusText("");
  };

  const checkActiveDepositStatus = async () => {
    if (!activePaymentId) return;

    try {
      setIsCheckingDeposit(true);
      const statusData =
        await walletService.checkDepositStatus(activePaymentId);
      const gatewayStatus = String(statusData?.gatewayStatus || "pending");
      setDepositStatusText(gatewayStatus);

      if (statusData?.transactionStatus === "completed") {
        await loadBalanceData();
        toast.success(
          language === "ar"
            ? "تم تأكيد الإيداع وإضافة الرصيد"
            : "Deposit confirmed and wallet updated",
        );
        resetDepositFlow();
        setIsDepositDialogOpen(false);
        return;
      }

      if (
        statusData?.transactionStatus === "failed" ||
        statusData?.transactionStatus === "cancelled"
      ) {
        toast.error(
          language === "ar"
            ? "لم تكتمل عملية الإيداع"
            : "Deposit was not completed",
        );
        resetDepositFlow();
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          (language === "ar"
            ? "تعذر التحقق من حالة الدفع"
            : "Failed to verify payment status"),
      );
    } finally {
      setIsCheckingDeposit(false);
    }
  };

  useEffect(() => {
    if (!isDepositDialogOpen || !activePaymentId) return;

    const timer = setInterval(() => {
      checkActiveDepositStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, [isDepositDialogOpen, activePaymentId]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    const minAmount = getMinDepositAmount(depositCurrency);
    const maxAmount = getMaxDepositAmount(depositCurrency);

    if (!amount || amount <= 0) {
      toast.error(t("pleaseEnterValidAmount"));
      return;
    }
    if (amount < minAmount) {
      toast.error(
        `${t("minimumDepositAmount")}: ${formatCurrency(
          minAmount,
          depositCurrency,
        )}`,
      );
      return;
    }
    if (amount > maxAmount) {
      toast.error(
        `${t("maximumDepositAmount")}: ${formatCurrency(
          maxAmount,
          depositCurrency,
        )}`,
      );
      return;
    }

    try {
      setIsSubmittingDeposit(true);
      const response = await walletService.deposit({
        amount,
        currency: depositCurrency,
        provider: depositProvider,
      });

      const transactionId = String(
        response?.data?.transactionId || response?.data?.paymentId || "",
      );
      const paymentUrl = String(response?.data?.paymentUrl || "");
      const createdProvider = String(
        response?.data?.provider || depositProvider,
      );

      if (!transactionId) {
        toast.error(
          language === "ar"
            ? "تعذر إنشاء طلب الإيداع"
            : "Failed to create deposit request",
        );
        return;
      }

      setActivePaymentId(transactionId);
      setActiveDepositProvider(createdProvider as DepositProvider);

      if (createdProvider === "paymera" && paymentUrl) {
        setDepositStatusText(language === "ar" ? "بانتظار الدفع" : "pending");
        toast.success(
          language === "ar"
            ? "تم فتح بوابة Paymera. أكمل الدفع ثم تحقق من الحالة."
            : "Paymera gateway opened. Complete payment then check status.",
        );
        window.location.assign(paymentUrl);
        return;
      }

      setDepositStatusText(
        language === "ar" ? "تم إرسال رمز التحقق" : "OTP sent",
      );

      toast.success(
        language === "ar"
          ? "تم إرسال الطلب . أدخل الرمز الذي يصلك ثم أكد العملية."
          : "request sent. Enter the OTP you received and confirm.",
      );
    } catch (error: any) {
      toast.error(error.message || t("balance.chargeError"));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleConfirmDeposit = async () => {
    if (activeDepositProvider !== "syriatel-cash") {
      toast.error(
        language === "ar"
          ? "التأكيد بالرمز متاح فقط لسيرياتيل كاش"
          : "OTP confirmation is only available for Syriatel Cash",
      );
      return;
    }

    if (!activePaymentId) {
      toast.error(
        language === "ar"
          ? "لا يوجد طلب إيداع نشط"
          : "No active deposit request",
      );
      return;
    }

    const otp = depositOtp.trim();
    if (!otp) {
      toast.error(
        language === "ar" ? "أدخل رمز التحقق أولاً" : "Enter the OTP first",
      );
      return;
    }

    try {
      setIsSubmittingDeposit(true);
      const response = await walletService.confirmDeposit({
        transactionId: activePaymentId,
        otp,
      });

      if (response?.success === false) {
        throw new Error(response?.message || t("balance.chargeError"));
      }

      await loadBalanceData();
      toast.success(
        language === "ar"
          ? "تم تأكيد الإيداع وإضافة الرصيد"
          : "Deposit confirmed and wallet updated",
      );
      resetDepositFlow();
      setIsDepositDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || t("balance.chargeError"));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleResendDepositOtp = async () => {
    if (activeDepositProvider !== "syriatel-cash") return;
    if (!activePaymentId) return;

    try {
      setIsResendingDepositOtp(true);
      const response = await walletService.resendDepositOtp(activePaymentId);
      if (response?.success === false) {
        throw new Error(response?.message || t("balance.chargeError"));
      }

      setDepositStatusText(
        language === "ar" ? "تمت إعادة إرسال الرمز" : "OTP resent",
      );
      toast.success(language === "ar" ? "تمت إعادة إرسال الرمز" : "OTP resent");
    } catch (error: any) {
      toast.error(error.message || t("balance.chargeError"));
    } finally {
      setIsResendingDepositOtp(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const minAmount = getMinWithdrawAmount(withdrawCurrency);
    const currentBalance = getCurrentBalance(withdrawCurrency);

    if (!amount || amount <= 0) {
      toast.error(t("pleaseEnterValidAmount"));
      return;
    }
    if (!withdrawMethod) {
      toast.error(t("pleaseSelectWithdrawMethod"));
      return;
    }
    if (amount < minAmount) {
      toast.error(
        `${t("minimumWithdrawAmount")}: ${formatCurrency(
          minAmount,
          withdrawCurrency,
        )}`,
      );
      return;
    }
    if (amount > currentBalance) {
      toast.error(t("insufficientBalance"));
      return;
    }

    try {
      await walletService.requestWithdrawal({
        amount,
        currency: withdrawCurrency,
        method: withdrawMethod,
        notes: withdrawNotes,
      });
      toast.success(t("withdrawalRequestSubmitted"));
      setWithdrawAmount("");
      setWithdrawMethod("");
      setWithdrawNotes("");
      setIsWithdrawDialogOpen(false);
      await loadBalanceData();
    } catch (error: any) {
      toast.error(error.message || t("balance.withdrawError"));
    }
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {t("localBalance")}
            </CardTitle>
            <CardDescription className="text-emerald-100">
              {t("syrianPoundForLocalRecharge")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {showBalanceSyp ? (
                <span className="text-lg sm:text-xl font-bold">
                  {formatAmountSYP(balanceSYP)}
                </span>
              ) : (
                <span className="text-lg sm:text-xl font-bold">••••••</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalanceSyp(!showBalanceSyp)}
                className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
              >
                {showBalanceSyp ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {t("internationalBalance")}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {t("usDollarForInternationalRecharge")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {showBalanceUsd ? (
                <span className="text-lg sm:text-xl font-bold">
                  {formatAmountUSD(balanceUSD)}
                </span>
              ) : (
                <span className="text-lg sm:text-xl font-bold">••••••</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalanceUsd(!showBalanceUsd)}
                className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
              >
                {showBalanceUsd ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-center">
        <Dialog
          open={isDepositDialogOpen}
          onOpenChange={setIsDepositDialogOpen}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("deposit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t("depositFunds")}
              </DialogTitle>
              <DialogDescription>{t("depositDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-provider">
                  {language === "ar" ? "وسيلة الإيداع" : "Deposit method"}
                </Label>
                <Select
                  value={depositProvider}
                  onValueChange={(value) => {
                    const nextProvider = value as DepositProvider;
                    setDepositProvider(nextProvider);
                    if (nextProvider === "syriatel-cash") {
                      setDepositCurrency("SYP");
                    }
                    setActivePaymentId("");
                    setDepositOtp("");
                    setDepositStatusText("");
                  }}
                >
                  <SelectTrigger id="deposit-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paymera">
                      {language === "ar" ? "بايميرا" : "Paymera"}
                    </SelectItem>
                    <SelectItem value="syriatel-cash">
                      {t("balance.syriatelCash")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deposit-currency">{t("currency")}</Label>
                <Select
                  value={depositCurrency}
                  onValueChange={(value) => {
                    const nextCurrency = value as Currency;
                    if (
                      depositProvider === "syriatel-cash" &&
                      nextCurrency !== "SYP"
                    ) {
                      setDepositCurrency("SYP");
                      return;
                    }

                    setDepositCurrency(nextCurrency);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYP">
                      {t("syrianPoundForLocalRecharge")}
                    </SelectItem>
                    {depositProvider === "syriatel-cash" ? null : (
                      <SelectItem value="USD">
                        {t("usDollarForInternationalRecharge")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deposit-amount">{t("amount")}</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min={getMinDepositAmount(depositCurrency)}
                  max={getMaxDepositAmount(depositCurrency)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("minimum")}:{" "}
                  {formatCurrency(
                    getMinDepositAmount(depositCurrency),
                    depositCurrency,
                  )}
                  {" | "}
                  {t("maximum")}:{" "}
                  {formatCurrency(
                    getMaxDepositAmount(depositCurrency),
                    depositCurrency,
                  )}
                </p>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-900">
                    {activeDepositProvider === "paymera"
                      ? language === "ar"
                        ? "سيتم نقلك إلى بوابة Paymera لإتمام الدفع. بعد الإتمام ارجع وتحقق من الحالة."
                        : "You will be redirected to the Paymera gateway. After payment, return and check status."
                      : language === "ar"
                        ? "سيتم إرسال طلب دفع عبر Syriatel Cash إلى رقمك المسجل. أدخل رمز التحقق الذي يصلك ثم أكد العملية."
                        : "A Syriatel Cash payment request will be sent to your registered number. Enter the OTP you receive, then confirm the payment."}
                  </p>
                  {activePaymentId ? (
                    <p className="mt-2 text-xs text-blue-800 break-all">
                      {language === "ar" ? "رقم العملية:" : "Transaction ID:"}{" "}
                      {activePaymentId}
                    </p>
                  ) : null}
                  {activeDepositProvider === "syriatel-cash" && user?.phone ? (
                    <p className="mt-1 text-xs text-blue-800 break-all">
                      {language === "ar" ? "سيتم الإرسال إلى:" : "Sent to:"}{" "}
                      {user.phone}
                    </p>
                  ) : null}
                  {depositStatusText ? (
                    <p className="mt-1 text-xs text-blue-800">
                      {language === "ar" ? "الحالة:" : "Status:"}{" "}
                      {depositStatusText}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {activePaymentId && activeDepositProvider === "syriatel-cash" ? (
                <div className="space-y-4 rounded-lg border border-blue-200 bg-white p-4">
                  <div>
                    <Label htmlFor="deposit-otp">
                      {language === "ar" ? "رمز التحقق OTP" : "OTP code"}
                    </Label>
                    <Input
                      id="deposit-otp"
                      inputMode="numeric"
                      placeholder={
                        language === "ar" ? "أدخل الرمز" : "Enter OTP"
                      }
                      value={depositOtp}
                      onChange={(e) => setDepositOtp(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleConfirmDeposit}
                      className="flex-1"
                      disabled={isSubmittingDeposit}
                    >
                      {isSubmittingDeposit
                        ? language === "ar"
                          ? "جاري التأكيد..."
                          : "Confirming..."
                        : language === "ar"
                          ? "تأكيد الإيداع"
                          : "Confirm deposit"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleResendDepositOtp}
                      disabled={isResendingDepositOtp}
                    >
                      {isResendingDepositOtp
                        ? language === "ar"
                          ? "جاري الإرسال..."
                          : "Resending..."
                        : language === "ar"
                          ? "إعادة إرسال OTP"
                          : "Resend OTP"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  onClick={
                    activePaymentId ? checkActiveDepositStatus : handleDeposit
                  }
                  className="flex-1"
                  disabled={isSubmittingDeposit}
                >
                  {activePaymentId
                    ? isCheckingDeposit
                      ? language === "ar"
                        ? "جاري التحقق..."
                        : "Checking..."
                      : language === "ar"
                        ? "تحقق من الحالة"
                        : "Check status"
                    : isSubmittingDeposit
                      ? language === "ar"
                        ? "جاري الإرسال..."
                        : "Sending..."
                      : language === "ar"
                        ? "إرسال الطلب"
                        : "Sendrequest"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={checkActiveDepositStatus}
                  className="flex-1"
                  disabled={!activePaymentId || isCheckingDeposit}
                >
                  {isCheckingDeposit
                    ? language === "ar"
                      ? "جاري التحقق..."
                      : "Checking..."
                    : language === "ar"
                      ? "تحقق من الحالة"
                      : "Check status"}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (activePaymentId) {
                        await walletService.cancelDeposit(activePaymentId);
                      }
                    } catch {
                      // Ignore cancellation errors on manual close.
                    } finally {
                      resetDepositFlow();
                      setIsDepositDialogOpen(false);
                    }
                  }}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Minus className="h-5 w-5" />
              {t("withdraw")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Minus className="h-5 w-5" />
                {t("withdrawFunds")}
              </DialogTitle>
              <DialogDescription>{t("withdrawDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdraw-currency">{t("currency")}</Label>
                <Select
                  value={withdrawCurrency}
                  onValueChange={(value) =>
                    setWithdrawCurrency(value as Currency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYP">
                      {t("syrianPoundForLocalRecharge")}
                    </SelectItem>
                    <SelectItem value="USD">
                      {t("usDollarForInternationalRecharge")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="withdraw-amount">{t("amount")}</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={getMinWithdrawAmount(withdrawCurrency)}
                  max={getCurrentBalance(withdrawCurrency)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("minimum")}:{" "}
                  {formatCurrency(
                    getMinWithdrawAmount(withdrawCurrency),
                    withdrawCurrency,
                  )}
                  {" | "}
                  {t("availableBalance")}:{" "}
                  {formatCurrency(
                    getCurrentBalance(withdrawCurrency),
                    withdrawCurrency,
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="withdraw-method">{t("withdrawMethod")}</Label>
                <Select
                  value={withdrawMethod}
                  onValueChange={setWithdrawMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectWithdrawMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    {withdrawMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <method.icon className="h-4 w-4" />
                          {method.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="withdraw-notes">
                  {t("notes")} ({t("optional")})
                </Label>
                <Textarea
                  id="withdraw-notes"
                  placeholder={t("withdrawNotesPlaceholder")}
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleWithdraw} className="flex-1">
                  {t("confirmWithdraw")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsWithdrawDialogOpen(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800">
                {t("importantNotice")}
              </h4>
              <p className="text-sm text-amber-700">{t("balanceNotice")}</p>
              <p className="text-sm text-amber-700 mt-2">
                • {t("localBalanceDescription")}
              </p>
              <p className="text-sm text-amber-700">
                • {t("internationalBalanceDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
