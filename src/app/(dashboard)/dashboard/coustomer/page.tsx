"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  HandCoins,
  Wallet,
} from "lucide-react";
import CustomerStatementDownload from "@/Component/CustomerStatementDownload";
import { authClient } from "@/lib/auth-client";
import {
  getCustomerAccountsByUserId,
  getCustomerTransactionsByUserId,
  type CustomerAccountSummary,
  type CustomerTransactionSummary,
} from "@/lib/data";

type TransactionKind = "deposit" | "withdrawal" | "transfer" | "other";

function getTransactionKind(
  transaction: CustomerTransactionSummary,
): TransactionKind {
  const type = transaction.paymentType?.toLowerCase() ?? "";
  if (type.includes("deposit")) return "deposit";
  if (type.includes("withdraw") || type === "loan-repayment") {
    return "withdrawal";
  }
  if (type.includes("transfer")) return "transfer";
  return "other";
}

function isCompleted(transaction: CustomerTransactionSummary): boolean {
  const status = transaction.statuses?.toLowerCase() ?? "";
  return (
    status.includes("complete") ||
    status.includes("approved") ||
    status.includes("success")
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getTotalBalance(
  accounts: CustomerAccountSummary[],
  transactions: CustomerTransactionSummary[],
): number | null {
  if (accounts.length === 0) return null;

  const balances = accounts.map((account) => {
    if (account.balance !== undefined) return account.balance;
    if (account.initialDeposit === undefined) return null;

    const accountTransactions = transactions.filter((transaction) =>
      account.accountNumber
        ? transaction.accountNumber === account.accountNumber
        : accounts.length === 1,
    );
    const netActivity = accountTransactions.reduce((total, transaction) => {
      if (!isCompleted(transaction)) return total;

      const amount = transaction.amount ?? 0;
      const kind = getTransactionKind(transaction);
      if (kind === "deposit") return total + amount;
      if (kind === "withdrawal") return total - amount;
      if (kind === "transfer") {
        return transaction.transferDirection === "received"
          ? total + amount
          : transaction.transferDirection === "sent"
            ? total - amount
            : total;
      }
      return total;
    }, 0);

    return account.initialDeposit + netActivity;
  });

  if (balances.some((balance) => balance === null)) return null;
  return balances.reduce<number>((total, balance) => total + (balance ?? 0), 0);
}

function formatDate(value: string | undefined): string {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("approved") ||
    normalized.includes("success")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("reject") || normalized.includes("failed")) {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-700";
}

export default function CustomerDashboard() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const [dashboardResult, setDashboardResult] = useState<{
    userId: string;
    accounts: CustomerAccountSummary[];
    transactions: CustomerTransactionSummary[];
    error: string;
  } | null>(null);
  const currentDashboardResult =
    dashboardResult?.userId === userId ? dashboardResult : null;
  const accounts = currentDashboardResult?.accounts ?? [];
  const transactions = currentDashboardResult?.transactions ?? [];
  const isLoading =
    isSessionPending || Boolean(userId && !currentDashboardResult);
  const error = currentDashboardResult?.error ?? "";

  useEffect(() => {
    if (!userId) return;

    let active = true;
    Promise.all([
      getCustomerAccountsByUserId(userId),
      getCustomerTransactionsByUserId(userId),
    ])
      .then(([customerAccounts, customerTransactions]) => {
        if (!active) return;
        setDashboardResult({
          userId,
          accounts: customerAccounts,
          transactions: customerTransactions,
          error: "",
        });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setDashboardResult({
            userId,
            accounts: [],
            transactions: [],
            error:
              loadError instanceof Error
                ? loadError.message
                : "Could not load your dashboard data",
          });
        }
      })

    return () => {
      active = false;
    };
  }, [userId, isSessionPending]);

  const completedTransactions = transactions.filter(isCompleted);
  const totalDeposits = completedTransactions.reduce(
    (total, transaction) =>
      getTransactionKind(transaction) === "deposit"
        ? total + (transaction.amount ?? 0)
        : total,
    0,
  );
  const totalWithdrawals = completedTransactions.reduce(
    (total, transaction) =>
      getTransactionKind(transaction) === "withdrawal"
        ? total + (transaction.amount ?? 0)
        : total,
    0,
  );
  const totalBalance = getTotalBalance(accounts, transactions);
  const recentTransactions = transactions.slice(0, 5);
  const displayName = session?.user?.name?.trim() || "Customer";

  const summaryCards = [
    {
      title: "Total Account Balance",
      value: totalBalance === null ? "—" : formatCurrency(totalBalance),
      note:
        accounts.length > 0
          ? `Across ${accounts.length} linked account${accounts.length === 1 ? "" : "s"}`
          : "No linked accounts",
      icon: Wallet,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      title: "Total Deposits",
      value: formatCurrency(totalDeposits),
      note: "Completed deposits",
      icon: ArrowDownLeft,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Total Withdrawals",
      value: formatCurrency(totalWithdrawals),
      note: "Completed withdrawals",
      icon: ArrowUpRight,
      iconClass: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-blue-100">
              CUSTOMER DASHBOARD
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Your account overview and recent activity.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            {isSessionPending ? "Loading profile..." : "Personal banking overview"}
          </div>
        </div>
      </header>

      <section
        aria-label="Account overview"
        className="grid gap-5 md:grid-cols-3"
      >
        {summaryCards.map(({ title, value, note, icon: Icon, iconClass }) => (
          <article
            key={title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-xl p-3 ${iconClass}`}>
                <Icon size={22} />
              </span>
              <span className="text-xs font-medium text-gray-400">
                {isLoading ? "Loading" : "Overview"}
              </span>
            </div>
            <p className="mt-5 text-sm text-gray-500">{title}</p>
            <p className="mt-1 truncate text-2xl font-bold text-gray-900">
              {isLoading ? "—" : value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{note}</p>
          </article>
        ))}
      </section>

      <CustomerStatementDownload accounts={accounts} isLoading={isLoading} />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest completed and pending account activity
            </p>
          </div>
          <Link
            href="/dashboard/coustomer/my-tranactions"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            View all transactions
          </Link>
        </div>

        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Loading transactions...
          </p>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <ArrowLeftRight size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              No transactions yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your recent activity will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Transaction</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 text-right font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((transaction, index) => {
                  const kind = getTransactionKind(transaction);
                  const incoming = kind === "deposit";
                  const method =
                    transaction.depositMethod ||
                    transaction.withdrawalMethod ||
                    "";
                  const status = transaction.statuses || "Unknown";
                  const transactionId =
                    transaction._id || `transaction-${index}`;

                  return (
                    <tr key={transactionId} className="hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-xl p-2.5 ${
                              incoming
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {incoming ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>
                          <div>
                            <p className="font-semibold capitalize text-gray-900">
                              {kind === "other" ? "Transaction" : kind}
                              {method ? ` · ${method}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Ref: {transaction.referenceNumber || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          incoming ? "text-emerald-700" : "text-gray-900"
                        }`}
                      >
                        {incoming ? "+" : kind === "withdrawal" ? "-" : ""}
                        {formatCurrency(transaction.amount ?? 0)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/coustomer/deposite"
          className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-800 transition hover:border-blue-300 hover:shadow-sm"
        >
          Request a deposit
        </Link>
        <Link
          href="/dashboard/coustomer/withdrawal"
          className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-800 transition hover:border-blue-300 hover:shadow-sm"
        >
          Request a withdrawal
        </Link>
        <Link
          href="/dashboard/coustomer/lone"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-800 transition hover:border-blue-300 hover:shadow-sm"
        >
          <HandCoins className="text-blue-700" size={18} />
          Apply for a loan
        </Link>
      </section>
    </main>
  );
}
