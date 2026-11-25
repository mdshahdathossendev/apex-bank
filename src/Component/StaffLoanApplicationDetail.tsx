"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { loneRequestAdmin } from "@/lib/action";
import type { LoanApplicationAdminNote } from "@/lib/action";
import ActionSuccessPage from "@/Component/ActionSuccessPage";
import {
  getLoanStatusLabel,
  getLoanWorkflowStage,
} from "@/lib/loan-status";

type LoanApplication = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function amount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

const details = [
  { label: "Applicant", key: "applicantName" },
  { label: "Email", key: "applicantEmail" },
  { label: "Loan type", key: "loanType" },
  { label: "Requested amount", key: "requestedAmount" },
  { label: "Loan term", key: "termMonths" },
  { label: "Monthly income", key: "monthlyIncome" },
  { label: "Employment status", key: "employmentStatus" },
  { label: "Employer", key: "employerName" },
  { label: "Application status", key: "applicationStatus" },
] as const;

export default function StaffLoanApplicationDetail({
  application,
}: {
  application: LoanApplication;
}) {
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const loanApplicationId = text(application._id);
  const applicationStatus = text(application.applicationStatus);
  const workflowStage = getLoanWorkflowStage(applicationStatus);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const staffNote = note.trim();
    if (!staffNote) {
      setNotice({ kind: "error", message: "Add a note before sending it." });
      return;
    }
    if (!loanApplicationId) {
      setNotice({
        kind: "error",
        message: "This application is missing its record ID.",
      });
      return;
    }

    setIsSending(true);
    setNotice(null);
    const payload: LoanApplicationAdminNote = {
      loanApplicationId,
      staffNote,
    };

    try {
      await loneRequestAdmin(payload);
      setNote("");
      setNotice({
        kind: "success",
        message: "The application was sent to admin for final acceptance.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not send the note to admin.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (notice?.kind === "success") {
    return (
      <ActionSuccessPage
        title="Loan application sent to admin"
        description={notice.message}
        details={[
          {
            label: "Applicant",
            value: text(application.applicantName) || "Not recorded",
          },
          {
            label: "Loan type",
            value: text(application.loanType) || "Loan",
          },
        ]}
        primaryLabel="Back to loan applications"
        primaryHref="/dashboard/staff/lon-application"
        secondaryHref="/dashboard/staff"
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/staff/lon-application"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft size={17} />
        Back to loan applications
      </Link>

      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-blue-100">LOAN APPLICATION</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {text(application.applicantName) || "Applicant details"}
        </h1>
        <p className="mt-2 text-sm text-white/75">
          Submitted {formatDate(application.submittedAt)}
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <FileText size={21} />
          </span>
          <div>
            <h2 className="font-semibold text-gray-900">
              Application details
            </h2>
            <p className="text-sm text-gray-500">
              Record ID: {loanApplicationId || "Unavailable"}
            </p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(({ label, key }) => {
            const value = application[key];
            const displayValue =
              key === "requestedAmount" || key === "monthlyIncome"
                ? formatCurrency(amount(value))
                : key === "termMonths"
                  ? `${amount(value)} months`
                  : key === "applicationStatus"
                    ? getLoanStatusLabel(value)
                  : text(value) || "—";
            return (
              <div key={key} className="rounded-xl bg-gray-50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words font-semibold text-gray-900">
                  {displayValue}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Loan purpose
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {text(application.purpose) || "No purpose provided."}
          </p>
        </div>
      </section>

      {workflowStage === "review" ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Review and send to admin
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your review note. The admin will make the final loan
              decision.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="admin-note"
              className="block text-sm font-medium text-gray-700"
            >
              Staff review note
            </label>
            <textarea
              id="admin-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Summarize your review for the admin..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                {note.length}/2000 characters
              </span>
              <button
                type="submit"
                disabled={isSending || !note.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {isSending ? "Sending..." : "Send to Admin"}
              </button>
            </div>
            {notice?.kind === "error" && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {notice.message}
              </p>
            )}
          </form>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-semibold text-gray-900">
            {getLoanStatusLabel(applicationStatus)}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {workflowStage === "sent_for_admin"
              ? "This application has been sent to the admin for a final decision."
              : workflowStage === "accepted"
                ? `The admin accepted this application${text(application.creditedAccountNumber) ? ` and credited account ${text(application.creditedAccountNumber)}` : ""}.`
                : "This application is no longer waiting for staff review."}
          </p>
        </section>
      )}
    </main>
  );
}
