"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  ReceiptText,
  Search,
} from "lucide-react";
import { approveTransaction } from "@/lib/action";

interface TransactionRecord {
  _id?: unknown;
  transactionId?: unknown;
  userId?: unknown;
  accountNumber?: unknown;
  paymentType?: unknown;
  type?: unknown;
  statuses?: unknown;
  status?: unknown;
  amount?: unknown;
  transferDirection?: unknown;
  depositMethod?: unknown;
  withdrawalMethod?: unknown;
  referenceNumber?: unknown;
  description?: unknown;
  createdAt?: unknown;
  date?: unknown;
}

const transactionTypeFilters = [
  "all",
  "deposit",
  "withdrawal",
  "transfer",
] as const;
const transactionStatusFilters = [
  "all",
  "pending",
  "completed",
  "rejected",
] as const;
const sortOrders = ["newest", "oldest"] as const;

type TransactionType = (typeof transactionTypeFilters)[number];
type TransactionStatus = (typeof transactionStatusFilters)[number];
type SortOrder = (typeof sortOrders)[number];

function isRecord(value: unknown): value is TransactionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function amountValue(value: unknown): number | null {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

function transactionType(transaction: TransactionRecord): Exclude<TransactionType, "all"> | "other" {
  const type = (text(transaction.paymentType) || text(transaction.type)).toLowerCase();
  if (type.includes("deposit")) return "deposit";
  if (type.includes("withdraw")) return "withdrawal";
  if (type.includes("transfer")) return "transfer";
  return "other";
}

function transactionStatus(transaction: TransactionRecord): string {
  return (text(transaction.statuses) || text(transaction.status) || "unknown")
    .toLowerCase();
}

function matchesStatus(status: string, filter: TransactionStatus): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status.includes("pending") || status.includes("process");
  if (filter === "completed") {
    return (
      status.includes("complete") ||
      status.includes("approved") ||
      status.includes("success")
    );
  }
  return status.includes("reject") || status.includes("failed");
}

function transactionDate(transaction: TransactionRecord): Date | null {
  const value = transaction.createdAt ?? transaction.date;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const id = text(transaction._id);
  if (/^[\da-f]{24}$/i.test(id)) {
    const timestamp = Number.parseInt(id.slice(0, 8), 16) * 1000;
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return null;
}

function formatDate(transaction: TransactionRecord): string {
  const date = transactionDate(transaction);
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusStyle(status: string): string {
  if (
    status.includes("complete") ||
    status.includes("approved") ||
    status.includes("success")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status.includes("reject") || status.includes("failed")) {
    return "bg-red-50 text-red-700";
  }
  if (status.includes("pending") || status.includes("process")) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-gray-100 text-gray-600";
}

export default function GetAllTransactions({
  data,
  allowApprovals = true,
}: {
  data: unknown;
  allowApprovals?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType>("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, string>
  >({});
  const [approvingId, setApprovingId] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [approvalNotice, setApprovalNotice] = useState<{
    status: "success" | "rejected";
    message: string;
  } | null>(null);

  const transactions = Array.isArray(data) ? data.filter(isRecord) : [];
  const currentStatus = (transaction: TransactionRecord) => {
    const id = text(transaction._id);
    return statusOverrides[id] ?? transactionStatus(transaction);
  };
  const deposits = transactions.reduce(
    (total, transaction) =>
      transactionType(transaction) === "deposit"
        ? total + (amountValue(transaction.amount) ?? 0)
        : total,
    0,
  );
  const pendingCount = transactions.filter((transaction) => {
    const status = currentStatus(transaction);
    return status.includes("pending") || status.includes("process");
  }).length;

  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toTime = dateTo
    ? new Date(`${dateTo}T23:59:59.999`).getTime()
    : null;
  const minAmount = minimumAmount ? Number(minimumAmount) : null;
  const maxAmount = maximumAmount ? Number(maximumAmount) : null;
  const query = search.trim().toLowerCase();

  const filteredTransactions = transactions
    .filter((transaction) => {
      const type = transactionType(transaction);
      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (!matchesStatus(currentStatus(transaction), statusFilter)) {
        return false;
      }

      const amount = amountValue(transaction.amount);
      if (minAmount !== null && (amount === null || amount < minAmount)) {
        return false;
      }
      if (maxAmount !== null && (amount === null || amount > maxAmount)) {
        return false;
      }

      if (fromTime !== null || toTime !== null) {
        const date = transactionDate(transaction);
        if (!date) return false;
        const timestamp = date.getTime();
        if (fromTime !== null && timestamp < fromTime) return false;
        if (toTime !== null && timestamp > toTime) return false;
      }

      const searchableText = [
        transaction.paymentType,
        transaction.type,
        transaction.userId,
        transaction.accountNumber,
        transaction.referenceNumber,
        transaction.depositMethod,
        transaction.withdrawalMethod,
        transaction.description,
        transaction._id,
        transaction.transactionId,
        transaction.amount,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .sort((left, right) => {
      const leftTime = transactionDate(left)?.getTime() ?? null;
      const rightTime = transactionDate(right)?.getTime() ?? null;
      if (leftTime === null && rightTime === null) return 0;
      if (leftTime === null) return 1;
      if (rightTime === null) return -1;
      return sortOrder === "newest"
        ? rightTime - leftTime
        : leftTime - rightTime;
    });

  const handleApprove = async (transaction: TransactionRecord) => {
    const transactionId = text(transaction._id);
    if (!transactionId) {
        setApprovalError("This request is missing its transaction ID.");
        return;
    }

    setApprovingId(transactionId);
    setApprovalError("");
    setApprovalNotice(null);
    try {
        const result = await approveTransaction(transactionId);
        setStatusOverrides((current) => ({
          ...current,
          [transactionId]: result.status,
        }));
        setApprovalNotice(result);
        router.refresh();
    } catch (error) {
        setApprovalError(
          error instanceof Error
            ? error.message
            : "Could not approve this transaction request.",
        );
    } finally {
        setApprovingId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinimumAmount("");
    setMaximumAmount("");
    setSortOrder("newest");
  };

  const summary = [
    {
      title: "All transactions",
      value: String(transactions.length),
      note: "Total records",
      icon: ReceiptText,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Pending",
      value: String(pendingCount),
      note: "Awaiting review",
      icon: CalendarDays,
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "Deposit volume",
      value: formatCurrency(deposits),
      note: "All recorded deposits",
      icon: ArrowDownLeft,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-blue-100">
              {allowApprovals ? "STAFF DASHBOARD" : "ADMIN DASHBOARD"}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              All transactions
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Deposits add to balances and withdrawals subtract. Requests with
              insufficient funds are rejected.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            <CircleDollarSign size={18} />
            {transactions.length} records
          </div>
        </div>
      </header>

      <section
        aria-label="Transaction summary"
        className="grid gap-4 md:grid-cols-3"
      >
        {summary.map(({ title, value, note, icon: Icon, color }) => (
          <article
            key={title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <span className={`inline-flex rounded-xl p-3 ${color}`}>
              <Icon size={21} />
            </span>
            <p className="mt-4 text-sm text-gray-500">{title}</p>
            <p className="mt-1 truncate text-2xl font-bold text-gray-900">
              {value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-5 border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Transaction records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredTransactions.length} of {transactions.length}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative block">
              <span className="sr-only">Search transaction records</span>
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search transaction records"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search customer, account, reference..."
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              aria-label="Filter by transaction type"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={typeFilter}
              onChange={(event) => {
                const selected = transactionTypeFilters.find(
                  (type) => type === event.target.value,
                );
                if (selected) setTypeFilter(selected);
              }}
            >
              <option value="all">All types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="transfer">Transfers</option>
            </select>
            <select
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={statusFilter}
              onChange={(event) => {
                const selected = transactionStatusFilters.find(
                  (status) => status === event.target.value,
                );
                if (selected) setStatusFilter(selected);
              }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed / approved</option>
              <option value="rejected">Rejected / failed</option>
            </select>
            <select
              aria-label="Sort transactions"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={sortOrder}
              onChange={(event) => {
                const selected = sortOrders.find(
                  (order) => order === event.target.value,
                );
                if (selected) setSortOrder(selected);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <label className="space-y-1 text-xs font-medium text-gray-500">
              From date
              <Input
                aria-label="Start date"
                className="w-full"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-gray-500">
              To date
              <Input
                aria-label="End date"
                className="w-full"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-gray-500">
              Minimum amount (BDT)
              <Input
                aria-label="Minimum transaction amount"
                className="w-full"
                min="0"
                placeholder="No minimum"
                type="number"
                value={minimumAmount}
                onChange={(event) => setMinimumAmount(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-gray-500">
              Maximum amount (BDT)
              <Input
                aria-label="Maximum transaction amount"
                className="w-full"
                min="0"
                placeholder="No maximum"
                type="number"
                value={maximumAmount}
                onChange={(event) => setMaximumAmount(event.target.value)}
              />
            </label>
          </div>
        </div>

        {allowApprovals && approvalError && (
          <p
            className="mx-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
            role="alert"
          >
            {approvalError}
          </p>
        )}
        {allowApprovals && approvalNotice && (
          <p
            className={`mx-5 mt-5 rounded-lg px-4 py-3 text-sm sm:mx-6 ${
              approvalNotice.status === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
            role="status"
          >
            {approvalNotice.message}
          </p>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <ReceiptText size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {transactions.length === 0
                ? "No transactions found"
                : "No matching transactions"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              {transactions.length === 0
                ? "New customer transactions will appear here."
                : "Change or clear the filters to see more records."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Transaction</th>
                  <th className="px-5 py-4 font-semibold">Customer ID</th>
                  <th className="px-5 py-4 font-semibold">Account</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 text-right font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((transaction, index) => {
                  const kind = transactionType(transaction);
                  const isDeposit = kind === "deposit";
                  const direction = text(transaction.transferDirection);
                  const isIncoming =
                    isDeposit || (kind === "transfer" && direction === "received");
                  const status = currentStatus(transaction);
                  const method =
                    text(transaction.depositMethod) ||
                    text(transaction.withdrawalMethod);
                  const transactionId =
                    text(transaction._id) ||
                    text(transaction.transactionId) ||
                    `transaction-${index}`;
                  const accountNumber = text(transaction.accountNumber);
                  const userId = text(transaction.userId);

                  return (
                    <tr key={transactionId} className="transition hover:bg-gray-50/80">
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
                            <p className="font-semibold capitalize text-gray-900">
                              {kind === "other" ? "Transaction" : kind}
                              {kind === "transfer"
                                ? direction === "received"
                                  ? " · received"
                                  : direction === "sent"
                                    ? " · sent"
                                    : ""
                                : ""}
                              {method ? ` · ${method}` : ""}
                            </p>
                            {text(transaction.description) ? (
                              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                {text(transaction.description)}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-gray-400">
                              Ref:{" "}
                              {text(transaction.referenceNumber) ||
                                text(transaction.transactionId) ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-600">
                        {userId ? `••••${userId.slice(-6)}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-600">
                        {accountNumber
                          ? `•••• ${accountNumber.slice(-4)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(transaction)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          isIncoming ? "text-emerald-700" : "text-gray-900"
                        }`}
                      >
                        {isIncoming
                          ? "+"
                          : kind === "withdrawal" ||
                              (kind === "transfer" && direction === "sent")
                            ? "-"
                            : ""}
                        {formatCurrency(amountValue(transaction.amount) ?? 0)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(status)}`}
                          >
                            {status}
                          </span>
                          {allowApprovals &&
                            (status.includes("pending") ||
                              status.includes("process")) && (
                            <button
                              type="button"
                              onClick={() => handleApprove(transaction)}
                              disabled={approvingId !== ""}
                              className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {approvingId === transactionId
                                ? "Approving..."
                                : "Mark as success"}
                            </button>
                          )}
                        </div>
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
}
