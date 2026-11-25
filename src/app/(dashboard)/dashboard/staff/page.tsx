import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  CheckCircle,
  Clock,
  HandCoins,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { getStaffDashboardData } from "@/lib/data";
import { getLoanStatusLabel } from "@/lib/loan-status";

type DashboardRecord = Record<string, unknown>;

function text(record: DashboardRecord, key: string): string {
  const value = record[key];
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

function amount(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
}

function recordDate(
  record: DashboardRecord,
  dateFields: string[],
): Date | null {
  for (const field of dateFields) {
    const value = record[field];
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
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
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function status(record: DashboardRecord): string {
  return (
    text(record, "statuses") ||
    text(record, "status") ||
    text(record, "applicationStatus") ||
    "unknown"
  ).toLowerCase();
}

function isPending(record: DashboardRecord): boolean {
  const value = status(record);
  return value.includes("pending") || value.includes("process");
}

function statusStyle(value: string): string {
  if (
    value.includes("complete") ||
    value.includes("approved") ||
    value.includes("success")
  ) {
    return "bg-green-100 text-green-700";
  }
  if (value.includes("reject") || value.includes("failed")) {
    return "bg-red-100 text-red-700";
  }
  if (value.includes("pending") || value.includes("process")) {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-gray-100 text-gray-600";
}

function dhakaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function StaffDashboardContent() {
  const { users, accounts, transactions, loanApplications } =
    await getStaffDashboardData();

  const customers = users.filter((user) => {
    const role = text(user, "role").toLowerCase();
    return role === "customer";
  });
  const accountCount = accounts.filter(
    (account) => text(account, "accountNumber") !== "",
  ).length;
  const verifiedCustomers = customers.filter(
    (customer) => customer.emailVerified === true,
  ).length;
  const todayKey = dhakaDateKey(new Date());
  const newCustomersToday = customers.filter((customer) => {
    const createdAt = recordDate(customer, ["createdAt"]);
    return createdAt !== null && dhakaDateKey(createdAt) === todayKey;
  }).length;

  const pendingTransactions = transactions.filter(isPending).length;
  const pendingLoans = loanApplications.filter(isPending).length;
  const pendingReviews = pendingTransactions + pendingLoans;

  const customerNames = new Map<string, string>();
  for (const customer of customers) {
    const name = text(customer, "name") || "Customer";
    const userId = text(customer, "id");
    const databaseId = text(customer, "_id");
    if (userId) customerNames.set(userId, name);
    if (databaseId) customerNames.set(databaseId, name);
  }

  const recentTransactions = [...transactions]
    .sort((left, right) => {
      const leftTime =
        recordDate(left, ["createdAt", "date"])?.getTime() ?? 0;
      const rightTime =
        recordDate(right, ["createdAt", "date"])?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 5);

  const recentLoans = [...loanApplications]
    .sort((left, right) => {
      const leftTime =
        recordDate(left, ["submittedAt", "createdAt"])?.getTime() ?? 0;
      const rightTime =
        recordDate(right, ["submittedAt", "createdAt"])?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 3);

  const statistics = [
    {
      title: "Total Customers",
      value: customers.length,
      note: "Customer profiles",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Accounts",
      value: accountCount,
      note: "Bank accounts",
      icon: Wallet,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Pending Transactions",
      value: pendingTransactions,
      note: "Awaiting review",
      icon: ArrowLeftRight,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Loan Applications",
      value: loanApplications.length,
      note: `${pendingLoans} awaiting review`,
      icon: HandCoins,
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live overview of customer banking operations.
          </p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-2 text-sm text-gray-600">
          {new Intl.DateTimeFormat("en-BD", {
            dateStyle: "full",
            timeZone: "Asia/Dhaka",
          }).format(new Date())}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className={`inline-flex rounded-xl p-3 ${item.color}`}>
                <Icon size={23} />
              </div>
              <p className="mt-5 text-sm text-gray-500">{item.title}</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {item.value.toLocaleString("en-BD")}
              </h2>
              <p className="mt-1 text-xs text-gray-400">{item.note}</p>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/staff/all-users"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <UserPlus size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Customer List</p>
              <p className="text-xs text-gray-500">Browse customer profiles</p>
            </div>
          </Link>

          <Link
            href="/dashboard/staff/accounts"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-purple-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <Wallet size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Create Account</p>
              <p className="text-xs text-gray-500">Open bank account</p>
            </div>
          </Link>

          <Link
            href="/dashboard/staff/all-transaction"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-orange-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Review Transactions</p>
              <p className="text-xs text-gray-500">Check transactions</p>
            </div>
          </Link>

          <Link
            href="/dashboard/staff/lon-application"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-green-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <HandCoins size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Review Loans</p>
              <p className="text-xs text-gray-500">Forward to admin</p>
            </div>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <div>
              <h2 className="font-bold text-gray-900">Recent Transactions</h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest customer banking activities
              </p>
            </div>
            <Link
              href="/dashboard/staff/all-transaction"
              className="text-sm font-semibold text-blue-600"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => {
                    const rawId =
                      text(transaction, "transactionId") ||
                      text(transaction, "_id");
                    const id = rawId
                      ? rawId.slice(-8).toUpperCase()
                      : `RECENT-${index + 1}`;
                    const userId = text(transaction, "userId");
                    const customer =
                      customerNames.get(userId) ||
                      (userId ? `Customer ${userId.slice(-6)}` : "Customer");
                    const transactionType =
                      text(transaction, "paymentType") ||
                      text(transaction, "type") ||
                      "Transaction";
                    const transactionStatus = status(transaction);

                    return (
                      <tr key={rawId || id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-700">
                          {id}
                        </td>
                        <td className="px-5 py-4 text-gray-600">{customer}</td>
                        <td className="px-5 py-4 capitalize text-gray-600">
                          {transactionType}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {formatCurrency(amount(transaction.amount))}
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
                      No transactions to show yet.
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
              <h2 className="font-bold text-gray-900">Loan Requests</h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest customer applications
              </p>
            </div>
            <div className="rounded-xl bg-green-100 p-2 text-green-600">
              <HandCoins size={20} />
            </div>
          </div>

          <div className="space-y-5 p-5">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan, index) => {
                const loanId = text(loan, "_id") || `loan-${index}`;
                const loanDetailsHref = text(loan, "_id")
                  ? `/dashboard/staff/lon-application/${encodeURIComponent(text(loan, "_id"))}`
                  : "/dashboard/staff/lon-application";
                const loanStatus = getLoanStatusLabel(
                  text(loan, "applicationStatus"),
                );
                return (
                  <div
                    key={loanId}
                    className="border-b border-gray-100 pb-4 last:border-0"
                  >
                    <h3 className="text-sm font-semibold text-gray-800">
                      {text(loan, "applicantName") || "Unnamed applicant"}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {text(loan, "loanType") || "Loan"} · {loanStatus}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(amount(loan.requestedAmount))}
                      </span>
                      <span className="text-right text-xs text-gray-400">
                        {formatDate(recordDate(loan, ["submittedAt", "createdAt"]))}
                      </span>
                    </div>
                    <Link
                      href={loanDetailsHref}
                      className="mt-3 block rounded-lg bg-blue-50 py-2 text-center text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Review Application
                    </Link>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-gray-500">
                No loan applications yet.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-green-100 p-3 text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Verified Customers</p>
            <h3 className="text-xl font-bold text-gray-900">
              {verifiedCustomers.toLocaleString("en-BD")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Reviews</p>
            <h3 className="text-xl font-bold text-gray-900">
              {pendingReviews.toLocaleString("en-BD")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">New Customers Today</p>
            <h3 className="text-xl font-bold text-gray-900">
              {newCustomersToday.toLocaleString("en-BD")}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
          Loading staff overview...
        </div>
      }
    >
      <StaffDashboardContent />
    </Suspense>
  );
}
