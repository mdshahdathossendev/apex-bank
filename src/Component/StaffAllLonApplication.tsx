"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
import Link from "next/link";
import {
  CalendarDays,
  HandCoins,
  UserRound,
} from "lucide-react";
import {
  getLoanStatusLabel,
  getLoanWorkflowStage,
} from "@/lib/loan-status";

interface LoanApplication {
  _id?: unknown;
  userId?: unknown;
  applicantName?: unknown;
  applicantEmail?: unknown;
  loanType?: unknown;
  requestedAmount?: unknown;
  termMonths?: unknown;
  purpose?: unknown;
  employmentStatus?: unknown;
  monthlyIncome?: unknown;
  employerName?: unknown;
  applicationStatus?: unknown;
  submittedAt?: unknown;
}

const loanTypes = [
  "all",
  "Personal loan",
  "Business loan",
  "Education loan",
  "Home loan",
] as const;
const applicationStatuses = [
  "all",
  "review",
  "sent_for_admin",
  "accepted",
  "rejected",
  "other",
] as const;
const statusFilterLabels: Record<
  Exclude<(typeof applicationStatuses)[number], "all">,
  string
> = {
  review: "Review for Staff",
  sent_for_admin: "Sent for Admin",
  accepted: "Accepted",
  rejected: "Rejected",
  other: "Other",
};
const sortOrders = ["newest", "oldest"] as const;

type LoanTypeFilter = (typeof loanTypes)[number];
type StatusFilter = (typeof applicationStatuses)[number];
type SortOrder = (typeof sortOrders)[number];

function statusFilterLabel(status: StatusFilter): string {
  return status === "all" ? "All statuses" : statusFilterLabels[status];
}

function isLoanApplication(value: unknown): value is LoanApplication {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

function applicationDate(application: LoanApplication): Date | null {
  const submittedAt = application.submittedAt;
  if (submittedAt instanceof Date) {
    return Number.isNaN(submittedAt.getTime()) ? null : submittedAt;
  }
  if (typeof submittedAt === "string" || typeof submittedAt === "number") {
    const date = new Date(submittedAt);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const id = text(application._id);
  if (/^[\da-f]{24}$/i.test(id)) {
    const date = new Date(Number.parseInt(id.slice(0, 8), 16) * 1000);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function formatDate(application: LoanApplication): string {
  const date = applicationDate(application);
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusStyle(status: string): string {
  switch (getLoanWorkflowStage(status)) {
    case "review":
      return "bg-amber-50 text-amber-700";
    case "sent_for_admin":
      return "bg-blue-50 text-blue-700";
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function StaffAllLoanApplications({
  loanApplications,
}: {
  loanApplications: unknown;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LoanTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const applications = Array.isArray(loanApplications)
    ? loanApplications.filter(isLoanApplication)
    : [];
  const pendingCount = applications.filter(
    (application) =>
      getLoanWorkflowStage(application.applicationStatus) === "review",
  ).length;
  const sentToAdminCount = applications.filter(
    (application) =>
      getLoanWorkflowStage(application.applicationStatus) === "sent_for_admin",
  ).length;
  const approvedCount = applications.filter(
    (application) =>
      getLoanWorkflowStage(application.applicationStatus) === "accepted",
  ).length;
  const requestedTotal = applications.reduce(
    (total, application) =>
      total + (numberValue(application.requestedAmount) ?? 0),
    0,
  );

  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toTime = dateTo
    ? new Date(`${dateTo}T23:59:59.999`).getTime()
    : null;
  const minAmount = minimumAmount ? Number(minimumAmount) : null;
  const maxAmount = maximumAmount ? Number(maximumAmount) : null;
  const query = search.trim().toLowerCase();

  const filteredApplications = applications
    .filter((application) => {
      const loanType = text(application.loanType);
      const statusStage = getLoanWorkflowStage(application.applicationStatus);
      if (typeFilter !== "all" && loanType !== typeFilter) return false;
      if (statusFilter !== "all" && statusStage !== statusFilter) return false;

      const amount = numberValue(application.requestedAmount);
      if (minAmount !== null && (amount === null || amount < minAmount)) {
        return false;
      }
      if (maxAmount !== null && (amount === null || amount > maxAmount)) {
        return false;
      }

      if (fromTime !== null || toTime !== null) {
        const date = applicationDate(application);
        if (!date) return false;
        const timestamp = date.getTime();
        if (fromTime !== null && timestamp < fromTime) return false;
        if (toTime !== null && timestamp > toTime) return false;
      }

      const searchableText = [
        application.applicantName,
        application.applicantEmail,
        application.userId,
        application.loanType,
        application.purpose,
        application.employerName,
        application.employmentStatus,
        application._id,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .sort((left, right) => {
      const leftTime = applicationDate(left)?.getTime() ?? null;
      const rightTime = applicationDate(right)?.getTime() ?? null;
      if (leftTime === null && rightTime === null) return 0;
      if (leftTime === null) return 1;
      if (rightTime === null) return -1;
      return sortOrder === "newest"
        ? rightTime - leftTime
        : leftTime - rightTime;
    });

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
      label: "Applications",
      value: String(applications.length),
      note: "Total requests",
      icon: HandCoins,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Review for Staff",
      value: String(pendingCount),
      note: "New customer applications",
      icon: CalendarDays,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Sent for Admin",
      value: String(sentToAdminCount),
      note: "Awaiting final decision",
      icon: UserRound,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Accepted",
      value: String(approvedCount),
      note: "Accepted by admin",
      icon: UserRound,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Requested total",
      value: formatCurrency(requestedTotal),
      note: "Across all applications",
      icon: HandCoins,
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-blue-100">
              STAFF DASHBOARD
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Loan applications
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Review and filter customer loan requests.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            {applications.length} applications
          </div>
        </div>
      </header>

      <section
        aria-label="Loan application summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {summary.map(({ label, value, note, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <span className={`inline-flex rounded-xl p-3 ${color}`}>
              <Icon size={21} />
            </span>
            <p className="mt-4 text-sm text-gray-500">{label}</p>
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
                Application records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredApplications.length} of {applications.length}
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
            <Input
              aria-label="Search loan applications"
              className="w-full"
              placeholder="Search name, email, purpose..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Filter by loan type"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={typeFilter}
              onChange={(event) => {
                const selected = loanTypes.find(
                  (type) => type === event.target.value,
                );
                if (selected) setTypeFilter(selected);
              }}
            >
              <option value="all">All loan types</option>
              {loanTypes.slice(1).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by application status"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={statusFilter}
              onChange={(event) => {
                const selected = applicationStatuses.find(
                  (status) => status === event.target.value,
                );
                if (selected) setStatusFilter(selected);
              }}
            >
              <option value="all">All statuses</option>
              {applicationStatuses.slice(1).map((status) => (
                <option key={status} value={status}>
                  {statusFilterLabel(status)}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort loan applications"
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
                aria-label="Minimum requested amount"
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
                aria-label="Maximum requested amount"
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

        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <HandCoins size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {applications.length === 0
                ? "No loan applications yet"
                : "No matching applications"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              {applications.length === 0
                ? "Customer applications will appear here when submitted."
                : "Adjust or clear the filters to see other applications."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Applicant</th>
                  <th className="px-5 py-4 font-semibold">Loan type</th>
                  <th className="px-5 py-4 font-semibold">Requested</th>
                  <th className="px-5 py-4 font-semibold">Purpose</th>
                  <th className="px-5 py-4 font-semibold">Income / work</th>
                  <th className="px-5 py-4 font-semibold">Submitted</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((application, index) => {
                  const applicantName =
                    text(application.applicantName) || "Unnamed applicant";
                  const applicantEmail = text(application.applicantEmail);
                  const userId = text(application.userId);
                  const loanType = text(application.loanType) || "Loan";
                  const status =
                    text(application.applicationStatus).toLowerCase() ||
                    "unknown";
                  const requestedAmount =
                    numberValue(application.requestedAmount) ?? 0;
                  const monthlyIncome =
                    numberValue(application.monthlyIncome) ?? 0;
                  const applicationId = text(application._id);
                  const id = applicationId || `loan-application-${index}`;

                  return (
                    <tr key={id} className="align-top transition hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {applicationId ? (
                            <Link
                              href={`/dashboard/staff/lon-application/${encodeURIComponent(applicationId)}`}
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {applicantName}
                            </Link>
                          ) : (
                            applicantName
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {applicantEmail || "Email not provided"}
                        </p>
                        {userId && (
                          <p className="mt-1 text-xs text-gray-400">
                            ID: ••••{userId.slice(-6)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">
                        {loanType}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(requestedAmount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {numberValue(application.termMonths) ?? "—"} months
                        </p>
                      </td>
                      <td className="max-w-64 px-5 py-4 text-gray-600">
                        <p className="line-clamp-2">
                          {text(application.purpose) || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">
                          {formatCurrency(monthlyIncome)} / month
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {text(application.employmentStatus) || "—"}
                          {text(application.employerName)
                            ? ` · ${text(application.employerName)}`
                            : ""}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(application)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(status)}`}
                        >
                          {getLoanStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {applicationId ? (
                          <Link
                            href={`/dashboard/staff/lon-application/${encodeURIComponent(applicationId)}`}
                            className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            View details
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Unavailable
                          </span>
                        )}
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
