"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Search } from "lucide-react";
import { approveLoanApplication } from "@/lib/action";
import type { BankAccountSummary } from "@/lib/data";

type LoanApplicationRecord = Record<string, unknown>;
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "other";
const statusFilters: StatusFilter[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "other",
];

function isRecord(value: unknown): value is LoanApplicationRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(record: LoanApplicationRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function amount(record: LoanApplicationRecord, key: string): number | null {
  const value = record[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function statusGroup(value: string): Exclude<StatusFilter, "all"> {
  const normalized = value.toLowerCase();
  if (normalized.includes("pending") || normalized.includes("process")) {
    return "pending";
  }
  if (
    normalized.includes("approved") ||
    normalized.includes("success") ||
    normalized.includes("accepted")
  ) {
    return "approved";
  }
  if (
    normalized.includes("reject") ||
    normalized.includes("deny") ||
    normalized.includes("fail")
  ) {
    return "rejected";
  }
  return "other";
}

function statusStyle(status: string): string {
  switch (statusGroup(status)) {
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return "Not recorded";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function submittedTime(record: LoanApplicationRecord): number {
  const date = new Date(text(record, "sentAt") || text(record, "submittedAt"));
  if (!Number.isNaN(date.getTime())) return date.getTime();

  const id = text(record, "_id");
  if (/^[\da-f]{24}$/i.test(id)) {
    return Number.parseInt(id.slice(0, 8), 16) * 1000;
  }
  return 0;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-BD");
}

export default function AdminLoanApplications({
  data,
  accounts,
}: {
  data: unknown;
  accounts: BankAccountSummary[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, string>
  >({});
  const [approvingId, setApprovingId] = useState("");
  const [approvalNotice, setApprovalNotice] = useState<{
    recordId: string;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const applications = useMemo(
    () => (Array.isArray(data) ? data.filter(isRecord) : []),
    [data],
  );

  const handleApprove = async (
    recordId: string,
    accountNumber: string,
  ) => {
    if (!accountNumber) {
      setApprovalNotice({
        recordId,
        type: "error",
        message: "Choose an active customer account first.",
      });
      return;
    }

    setApprovingId(recordId);
    setApprovalNotice(null);
    try {
      const result = await approveLoanApplication(recordId, accountNumber);
      setApprovalNotice({
        recordId,
        type: "success",
        message: result.message,
      });
      router.refresh();
    } catch (error) {
      setApprovalNotice({
        recordId,
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not approve this loan application.",
      });
    } finally {
      setApprovingId("");
    }
  };
  const pendingCount = applications.filter(
    (application) =>
      statusGroup(text(application, "applicationStatus")) === "pending",
  ).length;
  const requestedTotal = applications.reduce(
    (total, application) =>
      total + (amount(application, "requestedAmount") ?? 0),
    0,
  );
  const query = search.trim().toLowerCase();
  const filteredApplications = useMemo(
    () =>
      [...applications]
        .filter((application) => {
          const status = text(application, "applicationStatus");
          if (
            statusFilter !== "all" &&
            statusGroup(status) !== statusFilter
          ) {
            return false;
          }
          return [
            "applicantName",
            "applicantEmail",
            "userId",
            "loanApplicationId",
            "loanType",
            "applicationStatus",
            "purpose",
            "staffNote",
            "employerName",
          ]
            .map((key) => text(application, key))
            .join(" ")
            .toLowerCase()
            .includes(query);
        })
        .sort((left, right) => submittedTime(right) - submittedTime(left)),
    [applications, query, statusFilter],
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-blue-100">ADMIN DASHBOARD</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Admin loan applications
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Staff-submitted loan reviews and notes.
            </p>
          </div>
          <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            {formatCount(applications.length)} records
          </span>
        </div>
      </header>

      <section
        aria-label="Loan application summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <HandCoins size={22} />
          </span>
          <div>
            <p className="text-sm text-gray-500">Total records</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCount(applications.length)}
            </p>
          </div>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending applications</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {formatCount(pendingCount)}
          </p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total requested</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(requestedTotal)}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All admin loan records
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {formatCount(filteredApplications.length)} of{" "}
              {formatCount(applications.length)}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(240px,1fr)_170px]">
            <label className="relative block">
              <span className="sr-only">Search loan applications</span>
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search loan applications"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, loan, or note..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="sr-only" htmlFor="loan-status-filter">
              Filter by application status
            </label>
            <select
              id="loan-status-filter"
              value={statusFilter}
              onChange={(event) => {
                const selected = statusFilters.find(
                  (status) => status === event.target.value,
                );
                if (selected) setStatusFilter(selected);
              }}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-semibold text-gray-900">
              {applications.length === 0
                ? "No admin loan records found"
                : "No matching loan records"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {applications.length === 0
                ? "Records submitted to admin will appear here."
                : "Try another search term or status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1660px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Applicant</th>
                  <th className="px-5 py-4 font-semibold">Loan</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Requested
                  </th>
                  <th className="px-5 py-4 font-semibold">Employment</th>
                  <th className="px-5 py-4 font-semibold">Purpose</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Staff note</th>
                  <th className="px-5 py-4 font-semibold">Dates</th>
                  <th className="px-5 py-4 font-semibold">Disbursement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((application, index) => {
                  const recordId =
                    text(application, "_id") ||
                    text(application, "loanApplicationId") ||
                    `${text(application, "userId")}-${index}`;
                  const status =
                    text(application, "applicationStatus") || "Unknown";
                  const isPending = status.toLowerCase() === "pending";
                  const term = text(application, "termMonths");
                  const loanType = text(application, "loanType") || "Loan";
                  const customerAccounts = accounts.filter(
                    (account) =>
                      account.userId === text(application, "userId") &&
                      account.status.trim().toLowerCase() === "active",
                  );
                  const accountNumber =
                    customerAccounts.length === 1
                      ? customerAccounts[0].accountNumber
                      : selectedAccounts[recordId] ?? "";
                  const canApprove =
                    isPending && Boolean(text(application, "_id"));

                  return (
                    <tr key={recordId} className="align-top hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {text(application, "applicantName") ||
                            "Name unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {text(application, "applicantEmail") ||
                            "Email unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Application:{" "}
                          {text(application, "loanApplicationId") || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{loanType}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {term ? `${term} months` : "Term unavailable"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(
                          amount(application, "requestedAmount"),
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {text(application, "employmentStatus") ||
                            "Not recorded"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {text(application, "employerName") ||
                            "Employer unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Monthly income:{" "}
                          {formatCurrency(
                            amount(application, "monthlyIncome"),
                          )}
                        </p>
                      </td>
                      <td className="max-w-[220px] whitespace-normal px-5 py-4 text-gray-600">
                        {text(application, "purpose") || "Not recorded"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="max-w-[300px] whitespace-normal px-5 py-4 text-gray-600">
                        {text(application, "staffNote") || "No staff note"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                        <p>
                          Submitted:{" "}
                          {formatDate(text(application, "submittedAt"))}
                        </p>
                        <p className="mt-1">
                          Sent to admin: {formatDate(text(application, "sentAt"))}
                        </p>
                      </td>
                      <td className="min-w-[220px] px-5 py-4">
                        {canApprove ? (
                          <div className="space-y-2">
                            {customerAccounts.length === 1 ? (
                              <p className="text-xs text-gray-600">
                                Account: {customerAccounts[0].accountNumber}
                              </p>
                            ) : customerAccounts.length > 1 ? (
                              <select
                                aria-label={`Select disbursement account for ${text(application, "applicantName")}`}
                                value={accountNumber}
                                onChange={(event) =>
                                  setSelectedAccounts((current) => ({
                                    ...current,
                                    [recordId]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs"
                              >
                                <option value="">Choose account</option>
                                {customerAccounts.map((account) => (
                                  <option
                                    key={account.accountNumber}
                                    value={account.accountNumber}
                                  >
                                    {account.accountNumber} ·{" "}
                                    {account.accountType || "Account"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-red-700">
                                No active customer account found.
                              </p>
                            )}
                            <button
                              type="button"
                              disabled={
                                !accountNumber ||
                                approvingId === recordId ||
                                customerAccounts.length === 0
                              }
                              onClick={() =>
                                void handleApprove(recordId, accountNumber)
                              }
                              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {approvingId === recordId
                                ? "Approving..."
                                : "Mark success & credit"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {status.toLowerCase() === "success"
                              ? `Credited: ${text(application, "creditedAccountNumber") || "Account unavailable"}`
                              : "No disbursement"}
                          </span>
                        )}
                        {approvalNotice?.recordId === recordId && (
                          <p
                            className={`mt-2 text-xs ${
                              approvalNotice.type === "success"
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                            role={
                              approvalNotice.type === "error"
                                ? "alert"
                                : "status"
                            }
                          >
                            {approvalNotice.message}
                          </p>
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
