"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";

interface TransactionRecord {
  _id?: unknown;
  transactionId?: unknown;
  paymentType?: unknown;
  type?: unknown;
  statuses?: unknown;
  status?: unknown;
  amount?: unknown;
  depositMethod?: unknown;
  withdrawalMethod?: unknown;
  referenceNumber?: unknown;
  accountNumber?: unknown;
  transferDirection?: unknown;
  description?: unknown;
  createdAt?: unknown;
  date?: unknown;
}

type TransactionKind = "deposit" | "withdrawal" | "transfer" | "other";
type TransactionFilter = "all" | "deposit" | "withdrawal";

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "All activity", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
];

function isTransactionRecord(value: unknown): value is TransactionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function transactionKind(transaction: TransactionRecord): TransactionKind {
  const type = (text(transaction.paymentType) || text(transaction.type))
    .toLowerCase()
    .trim();

  if (type.includes("deposit")) return "deposit";
  if (type.includes("withdraw") || type === "loan-repayment") {
    return "withdrawal";
  }
  if (type.includes("transfer")) return "transfer";
  return "other";
}

function transactionAmount(value: unknown): number {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusStyle(status: string): string {
  if (
    status.includes("complete") ||
    status.includes("approved") ||
    status.includes("success")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (status.includes("reject") || status.includes("failed")) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }
  if (status.includes("pending") || status.includes("process")) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
  return "bg-gray-100 text-gray-600 ring-gray-500/10";
}

function transactionTitle(transaction: TransactionRecord): string {
  if (text(transaction.paymentType).toLowerCase() === "loan-repayment") {
    return "Loan repayment";
  }
  const kind = transactionKind(transaction);
  const method =
    text(transaction.depositMethod) || text(transaction.withdrawalMethod);
  const title =
    kind === "deposit"
      ? "Deposit"
      : kind === "withdrawal"
        ? "Withdrawal"
        : kind === "transfer"
          ? text(transaction.transferDirection) === "received"
            ? "Transfer received"
            : "Transfer sent"
          : text(transaction.paymentType) || text(transaction.type) || "Transaction";

  return method ? `${title} · ${method}` : title;
}

const MyTransactionss = ({ data }: { data: unknown }) => {
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [search, setSearch] = useState("");
  const transactions = Array.isArray(data) ? data.filter(isTransactionRecord) : [];

  const deposits = transactions.reduce(
    (total, transaction) =>
      transactionKind(transaction) === "deposit"
        ? total + transactionAmount(transaction.amount)
        : total,
    0,
  );
  const withdrawals = transactions.reduce(
    (total, transaction) =>
      transactionKind(transaction) === "withdrawal"
        ? total + transactionAmount(transaction.amount)
        : total,
    0,
  );
  const pendingCount = transactions.filter((transaction) => {
    const status = (text(transaction.statuses) || text(transaction.status))
      .toLowerCase();
    return status.includes("pending") || status.includes("process");
  }).length;

  const visibleTransactions = transactions.filter((transaction) => {
    const kind = transactionKind(transaction);
    if (filter !== "all" && kind !== filter) return false;

    const searchableText = [
      transactionTitle(transaction),
      transaction.referenceNumber,
      transaction._id,
      transaction.transactionId,
      transaction.description,
      transaction.accountNumber,
      transaction.amount,
    ]
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.trim().toLowerCase());
  });

  const summary = [
    {
      label: "Transactions",
      value: String(transactions.length),
      note: "Total activity",
      icon: ReceiptText,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Deposits",
      value: formatCurrency(deposits),
      note: "Total received",
      icon: ArrowDownLeft,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Withdrawals",
      value: formatCurrency(withdrawals),
      note: "Total withdrawn",
      icon: ArrowUpRight,
      iconClass: "bg-orange-50 text-orange-700",
    },
    {
      label: "Pending",
      value: String(pendingCount),
      note: "Awaiting review",
      icon: CalendarDays,
      iconClass: "bg-amber-50 text-amber-700",
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
              My transactions
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Review your deposits, withdrawals, and recent account activity.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            <Wallet size={18} />
            Your account activity
          </div>
        </div>
      </header>

      <section
        aria-label="Transaction summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summary.map(({ label, value, note, icon: Icon, iconClass }) => (
          <article
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-xl p-3 ${iconClass}`}>
                <Icon size={20} />
              </span>
              <ArrowLeftRight className="text-gray-300" size={18} />
            </div>
            <p className="mt-4 text-sm text-gray-500">{label}</p>
            <p className="mt-1 truncate text-xl font-bold text-gray-900">
              {value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Transaction history
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {visibleTransactions.length}{" "}
                {visibleTransactions.length === 1 ? "record" : "records"} found
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                size={17}
              />
              <Input
                aria-label="Search transactions"
                className="w-full pl-10"
                placeholder="Search reference, type, or account"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter transactions">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === item.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {visibleTransactions.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <ReceiptText size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {transactions.length === 0
                ? "No transactions yet"
                : "No matching transactions"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {transactions.length === 0
                ? "Your account activity will appear here when transactions are available."
                : "Try another search term or select a different filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Transaction</th>
                  <th className="px-5 py-4 font-semibold">Account</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 text-right font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTransactions.map((transaction, index) => {
                  const kind = transactionKind(transaction);
                  const amount = transactionAmount(transaction.amount);
                  const direction = text(transaction.transferDirection);
                  const isIncoming =
                    kind === "deposit" ||
                    (kind === "transfer" && direction === "received");
                  const isOutgoing =
                    kind === "withdrawal" ||
                    (kind === "transfer" && direction === "sent");
                  const status = (
                    text(transaction.statuses) ||
                    text(transaction.status) ||
                    "Unknown"
                  ).toLowerCase();
                  const rawAccountNumber = text(transaction.accountNumber);
                  const accountNumber = rawAccountNumber
                    ? `•••• ${rawAccountNumber.slice(-4)}`
                    : "—";
                  const id =
                    text(transaction._id) ||
                    text(transaction.transactionId) ||
                    `transaction-${index}`;

                  return (
                    <tr key={id} className="transition hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-xl p-2.5 ${
                              isIncoming
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {transactionTitle(transaction)}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {text(transaction.description) ||
                                `Ref: ${text(transaction.referenceNumber) || text(transaction.transactionId) || "—"}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-600">
                        {accountNumber}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(transaction.createdAt ?? transaction.date)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          isIncoming ? "text-emerald-700" : "text-gray-900"
                        }`}
                      >
                        {isIncoming ? "+" : isOutgoing ? "−" : ""}
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle(status)}`}
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
    </main>
  );
};

export default MyTransactionss;
