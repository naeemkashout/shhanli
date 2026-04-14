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
  CreditCard,
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

const SHAM_CASH_ACCOUNT_ID = "a44d9767cf5d5125af08af0e57511d0c";
const SHAM_CASH_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
  SHAM_CASH_ACCOUNT_ID,
)}`;

export default function Balance() {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [balanceSYP, setBalanceSYP] = useState(0);
  const [balanceUSD, setBalanceUSD] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<Currency>("SYP");
  const [withdrawCurrency, setWithdrawCurrency] = useState<Currency>("SYP");
  const [withdrawNotes, setWithdrawNotes] = useState("");
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

  const depositMethods = [
    { value: "card", label: t("creditCard"), icon: CreditCard },
    {
      value: "bank-transfer",
      label: t("balance.bankTransfer"),
      icon: Banknote,
    },
    {
      value: "mobile-payment",
      label: t("balance.shamCash"),
      icon: Smartphone,
    },
  ];

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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    const minAmount = getMinDepositAmount(depositCurrency);
    const maxAmount = getMaxDepositAmount(depositCurrency);

    if (!amount || amount <= 0) {
      toast.error(t("pleaseEnterValidAmount"));
      return;
    }
    if (!depositMethod) {
      toast.error(t("pleaseSelectPaymentMethod"));
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
      await walletService.deposit({
        amount,
        currency: depositCurrency,
        method: depositMethod,
      });
      await loadBalanceData();
      toast.success(t("depositRequestSubmitted"));
      setDepositAmount("");
      setDepositMethod("");
      setIsDepositDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || t("balance.chargeError"));
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
                <Label htmlFor="deposit-currency">{t("currency")}</Label>
                <Select
                  value={depositCurrency}
                  onValueChange={(value) =>
                    setDepositCurrency(value as Currency)
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
              <div>
                <Label htmlFor="deposit-method">{t("paymentMethod")}</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectPaymentMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    {depositMethods.map((method) => (
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

              {depositMethod === "mobile-payment" && (
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardContent className="pt-5">
                    <div className="space-y-3 text-center">
                      <h4 className="font-semibold text-indigo-900">
                        {language === "ar"
                          ? "الإيداع عبر شام كاش"
                          : "Deposit via Sham Cash"}
                      </h4>
                      <p className="text-sm text-indigo-800">
                        {language === "ar"
                          ? "امسح رمز QR التالي ثم نفّذ التحويل بنفس المبلغ قبل تأكيد الإيداع."
                          : "Scan the following QR code, then transfer the same amount before confirming deposit."}
                      </p>
                      <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
                        <img
                          src={SHAM_CASH_QR_URL}
                          alt="Sham Cash QR"
                          className="h-[180px] w-[180px] rounded"
                        />
                      </div>
                      <div className="text-sm text-indigo-900 space-y-1">
                        <p className="break-all">
                          <span className="font-medium">
                            {language === "ar" ? "المعرّف:" : "ID:"}
                          </span>{" "}
                          {SHAM_CASH_ACCOUNT_ID}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={handleDeposit} className="flex-1">
                  {t("confirmDeposit")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDepositDialogOpen(false)}
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
