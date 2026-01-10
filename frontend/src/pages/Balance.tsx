import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Search,
  Filter,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Currency = "SYP" | "USD";
type TransactionType = "all" | "deposit" | "withdrawal";
type TransactionStatus = "all" | "pending" | "completed" | "failed";
type FilterCurrency = "all" | Currency;

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  currency: Currency;
  status: "pending" | "completed" | "failed";
  method: string;
  date: string;
  reference?: string;
  notes?: string;
}

export default function Balance() {
  const { t, isRTL } = useLanguage();
  const [balanceSYP] = useState(1250000); // Syrian Pound balance
  const [balanceUSD] = useState(2500.75); // US Dollar balance
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<Currency>("SYP");
  const [withdrawCurrency, setWithdrawCurrency] = useState<Currency>("SYP");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TransactionType>("all");
  const [filterCurrency, setFilterCurrency] = useState<FilterCurrency>("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus>("all");
  const [showBalanceUsd, setShowBalanceUsd] = React.useState(true);
  const [showBalanceSyp, setShowBalanceSyp] = React.useState(true);

  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "deposit",
      amount: 500000,
      currency: "SYP",
      status: "completed",
      method: t("balance.bankTransfer"),
      date: "2024-01-15",
      reference: "DEP001234",
    },
    {
      id: "2",
      type: "withdrawal",
      amount: 200,
      currency: "USD",
      status: "pending",
      method: t("balance.bankTransfer"),
      date: "2024-01-14",
      reference: "WTH001235",
      notes: t("urgentWithdrawalRequest"),
    },
    {
      id: "3",
      type: "deposit",
      amount: 1000,
      currency: "USD",
      status: "completed",
      method: t("creditCard"),
      date: "2024-01-12",
      reference: "DEP001236",
    },
    {
      id: "4",
      type: "withdrawal",
      amount: 150000,
      currency: "SYP",
      status: "failed",
      method: t("mobileWallet"),
      date: "2024-01-10",
      reference: "WTH001237",
      notes: t("insufficientVerification"),
    },
    {
      id: "5",
      type: "deposit",
      amount: 750000,
      currency: "SYP",
      status: "completed",
      method: t("mobileWallet"),
      date: "2024-01-08",
      reference: "DEP001238",
    },
    {
      id: "6",
      type: "withdrawal",
      amount: 500,
      currency: "USD",
      status: "completed",
      method: t("balance.bankTransfer"),
      date: "2024-01-05",
      reference: "WTH001239",
    },
  ]);

  const depositMethods = [
    { value: "credit_card", label: t("creditCard"), icon: CreditCard },
    {
      value: "bank_transfer",
      label: t("balance.bankTransfer"),
      icon: Banknote,
    },
    { value: "mobile_wallet", label: t("mobileWallet"), icon: Smartphone },
  ];

  const withdrawMethods = [
    {
      value: "bank_transfer",
      label: t("balance.bankTransfer"),
      icon: Banknote,
    },
    { value: "mobile_wallet", label: t("mobileWallet"), icon: Smartphone },
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
  // Filtered Transactions using useMemo for performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        transaction.reference?.toLowerCase().includes(searchLower) ||
        transaction.method.toLowerCase().includes(searchLower) ||
        transaction.date.includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower);

      // Type filter
      const matchesType =
        filterType === "all" || transaction.type === filterType;

      // Currency filter
      const matchesCurrency =
        filterCurrency === "all" || transaction.currency === filterCurrency;

      // Status filter
      const matchesStatus =
        filterStatus === "all" || transaction.status === filterStatus;

      return matchesSearch && matchesType && matchesCurrency && matchesStatus;
    });
  }, [transactions, searchQuery, filterType, filterCurrency, filterStatus]);

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === "SYP") {
      return `${amount.toLocaleString("ar-SY")} ${t("syrianPoundSymbol")}`;
    }
    return `${t("dollarSymbol")}${amount.toFixed(2)}`;
  };

  const getCurrencyLabel = (currency: Currency) => {
    return currency === "SYP"
      ? t("syrianPoundWithCode")
      : t("usDollarWithCode");
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

  const handleDeposit = () => {
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
          depositCurrency
        )}`
      );
      return;
    }
    if (amount > maxAmount) {
      toast.error(
        `${t("maximumDepositAmount")}: ${formatCurrency(
          maxAmount,
          depositCurrency
        )}`
      );
      return;
    }

    // Simulate deposit processing
    toast.success(t("depositRequestSubmitted"));
    setDepositAmount("");
    setDepositMethod("");
    setIsDepositDialogOpen(false);
  };

  const handleWithdraw = () => {
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
          withdrawCurrency
        )}`
      );
      return;
    }
    if (amount > currentBalance) {
      toast.error(t("insufficientBalance"));
      return;
    }

    // Simulate withdrawal processing
    toast.success(t("withdrawalRequestSubmitted"));
    setWithdrawAmount("");
    setWithdrawMethod("");
    setWithdrawNotes("");
    setIsWithdrawDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {t(status)}
      </Badge>
    );
  };

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterCurrency("all");
    setFilterStatus("all");
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Balance Overview - Two Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Syrian Pound Balance */}
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

        {/* US Dollar Balance */}
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

      {/* Action Buttons */}
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
          <DialogContent className="sm:max-w-md">
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
                      <div className="flex items-center gap-2">
                        {t("syrianPoundForLocalRecharge")}
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        {t("usDollarForInternationalRecharge")}
                      </div>
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
                    depositCurrency
                  )}{" "}
                  | {t("maximum")}:{" "}
                  {formatCurrency(
                    getMaxDepositAmount(depositCurrency),
                    depositCurrency
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
                      <div className="flex items-center gap-2">
                        {t("syrianPoundForLocalRecharge")}
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        {t("usDollarForInternationalRecharge")}
                      </div>
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
                    withdrawCurrency
                  )}{" "}
                  | {t("availableBalance")}:{" "}
                  {formatCurrency(
                    getCurrentBalance(withdrawCurrency),
                    withdrawCurrency
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

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("transactionHistory")}</CardTitle>
              <CardDescription>{t("recentTransactions")}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {t("transactionsCount", {
                filtered: filteredTransactions.length,
                total: transactions.length,
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchTransactionsPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("transactionType")}
                </Label>
                <Select
                  value={filterType}
                  onValueChange={(value: string) =>
                    setFilterType(value as TransactionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="deposit">{t("deposit")}</SelectItem>
                    <SelectItem value="withdrawal">
                      {t("withdrawal")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("currency")}
                </Label>
                <Select
                  value={filterCurrency}
                  onValueChange={(value: string) =>
                    setFilterCurrency(value as FilterCurrency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="SYP">{t("syrianPound")}</SelectItem>
                    <SelectItem value="USD">{t("usDollar")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("status")}
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value: string) =>
                    setFilterStatus(value as TransactionStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="failed">{t("failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("noMatchingTransactions")}</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "deposit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "deposit" ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.type === "deposit"
                          ? t("deposit")
                          : t("withdrawal")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.method} • {transaction.date}
                      </div>
                      {transaction.reference && (
                        <div className="text-xs text-muted-foreground">
                          {t("reference")}: {transaction.reference}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          transaction.type === "deposit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" ? "+" : "-"}
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCurrencyLabel(transaction.currency)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewTransactionDetails(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog
        open={isTransactionDetailsOpen}
        onOpenChange={setIsTransactionDetailsOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("transactionDetails")}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("type")}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`p-1 rounded-full ${
                        selectedTransaction.type === "deposit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {selectedTransaction.type === "deposit" ? (
                        <Plus className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </div>
                    {selectedTransaction.type === "deposit"
                      ? t("deposit")
                      : t("withdrawal")}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("amount")}
                  </Label>
                  <div
                    className={`mt-1 font-semibold ${
                      selectedTransaction.type === "deposit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.type === "deposit" ? "+" : "-"}
                    {formatCurrency(
                      selectedTransaction.amount,
                      selectedTransaction.currency
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getCurrencyLabel(selectedTransaction.currency)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("status")}
                  </Label>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(selectedTransaction.status)}
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("method")}
                  </Label>
                  <div className="mt-1">{selectedTransaction.method}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("date")}
                  </Label>
                  <div className="mt-1">{selectedTransaction.date}</div>
                </div>
                {selectedTransaction.reference && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t("reference")}
                    </Label>
                    <div className="mt-1 font-mono text-sm">
                      {selectedTransaction.reference}
                    </div>
                  </div>
                )}
              </div>
              {selectedTransaction.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("notes")}
                  </Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {selectedTransaction.notes}
                  </div>
                </div>
              )}
              <Separator />
              <Button
                onClick={() => setIsTransactionDetailsOpen(false)}
                className="w-full"
              >
                {t("close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Important Notice */}
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
