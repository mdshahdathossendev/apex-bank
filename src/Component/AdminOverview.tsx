import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import {
  CheckCircle,
  Clock,
  HandCoins,
  Landmark,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { DashboardOverviewData } from "@/lib/data";
import {
  getLoanStatusLabel,
  getLoanWorkflowStage,
} from "@/lib/loan-status";

type DashboardRecord = Record<string, unknown>;

const OPENING_BANK_BALANCE_CENTS = 20_000_000;

function text(record: DashboardRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function amountInCents(value: unknown): number {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : 0;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function status(record: DashboardRecord): string {
  return (
    text(record, "statuses") ||
    text(record, "status") ||
    text(record, "applicationStatus") ||
    "unknown"
  ).toLowerCase();
}

function isSuccessful(record: DashboardRecord): boolean {
  const value = status(record);
  return (
    value.includes("success") ||
    value.includes("complete") ||
    value.includes("approved")
  );
}

function isLoanDisbursement(record: DashboardRecord): boolean {
  return (
    !isLoanRepayment(record) &&
    (Boolean(text(record, "loanApplicationId")) ||
      text(record, "depositMethod").toLowerCase() === "loan disbursement" ||
      text(record, "paymentType").toLowerCase() === "loan")
  );
}

function isLoanRepayment(record: DashboardRecord): boolean {
  return text(record, "paymentType").toLowerCase() === "loan-repayment";
}

function recordDate(record: DashboardRecord): Date | null {
  const value = record.createdAt ?? record.submittedAt ?? record.date;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const id = text(record, "_id");
  if (/^[\da-f]{24}$/i.test(id)) {
    const date = new Date(Number.parseInt(id.slice(0, 8), 16) * 1000);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function formatDate(date: Date | null): string {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function statusStyle(value: string): string {
  const loanStage = getLoanWorkflowStage(value);
  if (loanStage === "sent_for_admin") {
    return "bg-blue-50 text-blue-700";
  }
  if (loanStage === "review") {
    return "bg-amber-50 text-amber-700";
  }
  if (loanStage === "accepted") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (loanStage === "rejected") {
    return "bg-red-50 text-red-700";
  }
  if (
    value.includes("success") ||
    value.includes("complete") ||
    value.includes("approved")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (value.includes("reject") || value.includes("failed")) {
    return "bg-red-50 text-red-700";
  }
  if (value.includes("pending") || value.includes("process")) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-gray-100 text-gray-600";
}

function isPending(record: DashboardRecord): boolean {
  return (
    status(record).includes("pending") ||
    status(record).includes("process") ||
    status(record).includes("sent_for_admin")
  );
}

function isApproved(record: DashboardRecord): boolean {
  const value = status(record);
  return value.includes("approved") || value.includes("success");
}

function isRejected(record: DashboardRecord): boolean {
  const value = status(record);
  return value.includes("reject") || value.includes("failed");
}

function transactionKind(transaction: DashboardRecord): string {
  if (isLoanRepayment(transaction)) return "Loan repayment";
  return isLoanDisbursement(transaction)
    ? "Loan disbursement"
    : text(transaction, "paymentType") ||
        text(transaction, "type") ||
        "Transaction";
}

function bankImpactInCents(transaction: DashboardRecord): number | null {
  if (!isSuccessful(transaction)) return null;
  const amount = amountInCents(transaction.amount);
  if (isLoanRepayment(transaction)) return amount;
  if (isLoanDisbursement(transaction)) return -amount;

  const type = text(transaction, "paymentType").toLowerCase();
  if (type === "deposit") return amount;
  if (type === "withdrawal") return -amount;
  return 0;
}

function sortNewest(records: DashboardRecord[]): DashboardRecord[] {
  return [...records].sort(
    (left, right) =>
      (recordDate(right)?.getTime() ?? 0) -
      (recordDate(left)?.getTime() ?? 0),
  );
}

function transactionId(transaction: DashboardRecord, index: number): string {
  const id = text(transaction, "transactionId") || text(transaction, "_id");
  return id ? id.slice(-8).toUpperCase() : `RECENT-${index + 1}`;
}

async function DashboardDate() {
  await io();
  return (
    <div className="rounded-xl border bg-white px-4 py-2 text-sm text-gray-600">
      {new Intl.DateTimeFormat("en-BD", {
        dateStyle: "full",
        timeZone: "Asia/Dhaka",
      }).format(new Date())}
    </div>
  );
}

export default function AdminOverview({
  data,
}: {
  data: DashboardOverviewData;
}) {
  const customers = data.users.filter(
    (user) => text(user, "role").toLowerCase() === "customer",
  );
  const accounts = data.accounts.filter(
    (account) => text(account, "accountNumber") !== "",
  );
  const successfulTransactions = data.transactions.filter(isSuccessful);

  const openingAccountDeposits = accounts.reduce(
    (total, account) => total + amountInCents(account.initialDeposit),
    0,
  );
  const customerDeposits = successfulTransactions.reduce((total, transaction) => {
    if (
      text(transaction, "paymentType").toLowerCase() !== "deposit" ||
      isLoanDisbursement(transaction)
    ) {
      return total;
    }
    return total + amountInCents(transaction.amount);
  }, 0);
  const withdrawals = successfulTransactions.reduce((total, transaction) => {
    return text(transaction, "paymentType").toLowerCase() === "withdrawal"
      ? total + amountInCents(transaction.amount)
      : total;
  }, 0);
  const loanRepayments = successfulTransactions.reduce(
    (total, transaction) =>
      isLoanRepayment(transaction)
        ? total + amountInCents(transaction.amount)
        : total,
    0,
  );
  const loanDisbursements = successfulTransactions.reduce((total, transaction) =>
    isLoanDisbursement(transaction)
      ? total + amountInCents(transaction.amount)
      : total,
  0);
  const bankBalance =
    OPENING_BANK_BALANCE_CENTS +
    openingAccountDeposits +
    customerDeposits -
    withdrawals -
    loanDisbursements +
    loanRepayments;

  const customerNames = new Map<string, string>();
  for (const customer of customers) {
    const name = text(customer, "name") || "Customer";
    const userId = text(customer, "id");
    const databaseId = text(customer, "_id");
    if (userId) customerNames.set(userId, name);
    if (databaseId) customerNames.set(databaseId, name);
  }
  for (const account of accounts) {
    const userId = text(account, "userId");
    const name = text(account, "name");
    if (userId && name && !customerNames.has(userId)) {
      customerNames.set(userId, name);
    }
  }

  const recentTransactions = sortNewest(data.transactions).slice(0, 5);
  const recentLoans = sortNewest(data.loanApplications).slice(0, 3);
  const pendingTransactions = data.transactions.filter(isPending).length;
  const pendingLoans = data.loanApplications.filter(isPending).length;
  const approvedLoans = data.loanApplications.filter(isApproved).length;
  const rejectedLoans = data.loanApplications.filter(isRejected).length;
  const statistics = [
    {
      title: "Bank Balance",
      value: formatCurrency(bankBalance),
      note: "After successful deposits, withdrawals, and loan disbursements",
      icon: Landmark,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Total Customers",
      value: customers.length.toLocaleString("en-BD"),
      note: "Customer profiles",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Accounts",
      value: accounts.length.toLocaleString("en-BD"),
      note: "Bank accounts",
      icon: Wallet,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Pending Reviews",
      value: (pendingTransactions + pendingLoans).toLocaleString("en-BD"),
      note: `${pendingTransactions} transactions · ${pendingLoans} loans`,
      icon: Clock,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live bank balance and customer activity.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-xl border bg-white px-4 py-2 text-sm text-gray-600">
              Today
            </div>
          }
        >
          <DashboardDate />
        </Suspense>
      </header>

      <section
        aria-label="Bank overview statistics"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statistics.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <span className={`inline-flex rounded-xl p-3 ${item.color}`}>
                <Icon size={23} />
              </span>
              <p className="mt-5 text-sm text-gray-500">{item.title}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-gray-400">{item.note}</p>
            </article>
          );
        })}
      </section>

      <section
        aria-label="Bank balance calculation"
        className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 className="font-bold text-gray-900">Bank balance breakdown</h2>
        <p className="mt-1 text-sm text-gray-500">
          Only successful transactions affect the balance. Internal transfers
          do not change the bank total.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Opening bank balance", OPENING_BANK_BALANCE_CENTS, "neutral"],
            ["Account opening deposits", openingAccountDeposits, "positive"],
            ["Customer deposits", customerDeposits, "positive"],
            ["Customer withdrawals", withdrawals, "negative"],
            ["Loan repayments", loanRepayments, "positive"],
            ["Loan disbursements", loanDisbursements, "negative"],
          ].map(([label, amount, kind]) => (
            <div key={String(label)} className="rounded-xl bg-gray-50 p-4">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd
                className={`mt-2 text-sm font-semibold ${
                  kind === "positive"
                    ? "text-emerald-700"
                    : kind === "negative"
                      ? "text-red-700"
                      : "text-gray-900"
                }`}
              >
                {kind === "negative" ? "− " : kind === "positive" ? "+ " : ""}
                {formatCurrency(Number(amount))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-gray-900">Recent Transactions</h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest customer banking activity
              </p>
            </div>
            <Link
              href="/dashboard/admin/all-transactions"
              className="text-sm font-semibold text-blue-600"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4 text-right">Bank impact</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => {
                    const id = transactionId(transaction, index);
                    const impact = bankImpactInCents(transaction);
                    const customer =
                      customerNames.get(text(transaction, "userId")) ||
                      "Customer";
                    const transactionStatus = status(transaction);
                    const impactLabel =
                      impact === null
                        ? "—"
                        : `${impact > 0 ? "+ " : impact < 0 ? "− " : ""}${formatCurrency(Math.abs(impact))}`;

                    return (
                      <tr
                        key={text(transaction, "_id") || id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-medium text-gray-700">
                          #{id}
                        </td>
                        <td className="px-5 py-4 text-gray-600">{customer}</td>
                        <td className="px-5 py-4 capitalize text-gray-600">
                          {transactionKind(transaction)}
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-semibold ${
                            impact !== null && impact > 0
                              ? "text-emerald-700"
                              : impact !== null && impact < 0
                                ? "text-red-700"
                                : "text-gray-600"
                          }`}
                        >
                          {impactLabel}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(transactionStatus)}`}
                          >
                            {transactionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-gray-900">Recent Loan Requests</h2>
              <p className="mt-1 text-xs text-gray-500">
                {pendingLoans.toLocaleString("en-BD")} awaiting review
              </p>
            </div>
            <HandCoins className="text-orange-600" size={22} />
          </div>
          <div className="space-y-4 p-5">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan, index) => (
                <article
                  key={text(loan, "_id") || `${text(loan, "userId")}-${index}`}
                  className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {text(loan, "applicantName") || "Customer"}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {text(loan, "loanType") || "Loan"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(status(loan))}`}
                    >
                      {getLoanStatusLabel(status(loan))}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(amountInCents(loan.requestedAmount))}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(recordDate(loan))}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-gray-500">
                No loan applications yet.
              </p>
            )}
            <Link
              href="/dashboard/admin/admin-loan-applications"
              className="block rounded-lg bg-blue-50 px-3 py-2.5 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              View loan management
            </Link>
          </div>
        </section>
      </div>

      <section aria-label="Loan summary" className="grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Approved Loans",
            value: approvedLoans,
            icon: CheckCircle,
            color: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Pending Loans",
            value: pendingLoans,
            icon: Clock,
            color: "bg-amber-100 text-amber-700",
          },
          {
            label: "Rejected Loans",
            value: rejectedLoans,
            icon: XCircle,
            color: "bg-red-100 text-red-700",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className="flex items-center gap-4 rounded-2xl border bg-white p-5"
            >
              <span className={`rounded-xl p-3 ${item.color}`}>
                <Icon size={24} />
              </span>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {item.value.toLocaleString("en-BD")}
                </p>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
