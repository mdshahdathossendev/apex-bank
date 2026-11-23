"use client";

import type { FormEvent } from "react";
import { Button, Input } from "@heroui/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  HandCoins,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { loneRequest, type LoanApplicationInput } from "@/lib/action";
import ActionSuccessPage from "@/Component/ActionSuccessPage";

const loanTypes = [
  "Personal loan",
  "Business loan",
  "Education loan",
  "Home loan",
] as const;

const employmentStatuses = [
  "Salaried",
  "Self-employed",
  "Business owner",
  "Student",
  "Other",
] as const;

type LoanType = (typeof loanTypes)[number];
type EmploymentStatus = (typeof employmentStatuses)[number];

export default function LoanApplicationPage() {
  const { data: session, isPending } = authClient.useSession();
  const [loanType, setLoanType] = useState<LoanType>("Personal loan");
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>("Salaried");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [purpose, setPurpose] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setMessage({
        type: "error",
        text: "Sign in before submitting a loan application.",
      });
      return;
    }

    const applicationData: LoanApplicationInput = {
      loanType,
      requestedAmount: Number(amount),
      termMonths: Number(termMonths),
      purpose: purpose.trim(),
      employmentStatus,
      monthlyIncome: Number(monthlyIncome),
      employerName: employerName.trim(),
    };

  setIsSubmitting(true);
  setMessage(null);
  try {
    await loneRequest(applicationData);
    setMessage({
      type: "success",
      text: "Your loan application was submitted successfully.",
    });
  } catch (error) {
    setMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Could not submit your loan application.",
    });
  } finally {
    setIsSubmitting(false);
  }
}

  const numericAmount = Number(amount);
  const formattedAmount =
    amount && Number.isFinite(numericAmount)
      ? new Intl.NumberFormat("en-BD", {
          style: "currency",
          currency: "BDT",
          maximumFractionDigits: 0,
        }).format(numericAmount)
      : "৳0";

  if (message?.type === "success") {
    return (
      <ActionSuccessPage
        title="Loan application submitted"
        description="Your application was saved and sent to staff for review. You will be notified after it is reviewed."
        details={[
          { label: "Loan type", value: loanType },
          { label: "Requested amount", value: formattedAmount },
          { label: "Repayment term", value: `${termMonths} months` },
        ]}
        primaryLabel="Back to loan center"
        primaryHref="/dashboard/coustomer/lone"
        secondaryHref="/dashboard/coustomer"
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <HandCoins size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">
                APEX BANK · LOAN CENTER
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Apply for a loan
              </h1>
              <p className="mt-1 text-sm text-white/75">
                Tell us a little about your plans and financing needs.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50">
            <p className="font-semibold">Your application</p>
            <p className="mt-1 text-white/70">Review before you submit</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Applicant information
                </h2>
                <p className="text-xs text-gray-500">
                  Filled from your signed-in profile
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Full name
                <Input
                  aria-label="Applicant full name"
                  className="w-full"
                  disabled={isPending}
                  value={session?.user?.name ?? ""}
                  placeholder="Your full name"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Email address
                <Input
                  aria-label="Applicant email address"
                  className="w-full"
                  disabled={isPending}
                  type="email"
                  value={session?.user?.email ?? ""}
                  placeholder="you@example.com"
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                <HandCoins size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Loan details</h2>
                <p className="text-xs text-gray-500">
                  Choose the amount and repayment period you need
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Loan type
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={loanType}
                  onChange={(event) => {
                    const selected = loanTypes.find(
                      (type) => type === event.target.value,
                    );
                    if (selected) setLoanType(selected);
                  }}
                >
                  {loanTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Requested amount (BDT)
                <Input
                  aria-label="Requested loan amount in BDT"
                  className="w-full"
                  min="1"
                  name="requestedAmount"
                  placeholder="e.g. 250000"
                  required
                  step="1"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Repayment period
                <div className="relative">
                  <CalendarClock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={17}
                  />
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={termMonths}
                    onChange={(event) => setTermMonths(event.target.value)}
                  >
                    {[6, 12, 18, 24, 36, 48, 60].map((months) => (
                      <option key={months} value={months}>
                        {months} months
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Purpose of loan
                <Input
                  aria-label="Purpose of loan"
                  className="w-full"
                  name="purpose"
                  placeholder="What will the loan be used for?"
                  required
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Income information
                </h2>
                <p className="text-xs text-gray-500">
                  Used to understand your repayment capacity
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Employment status
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={employmentStatus}
                  onChange={(event) => {
                    const selected = employmentStatuses.find(
                      (status) => status === event.target.value,
                    );
                    if (selected) setEmploymentStatus(selected);
                  }}
                >
                  {employmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Monthly income (BDT)
                <Input
                  aria-label="Monthly income in BDT"
                  className="w-full"
                  min="0"
                  name="monthlyIncome"
                  placeholder="e.g. 50000"
                  required
                  step="1"
                  type="number"
                  value={monthlyIncome}
                  onChange={(event) => setMonthlyIncome(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                Employer or business name
                <Input
                  aria-label="Employer or business name"
                  className="w-full"
                  name="employerName"
                  placeholder="Optional"
                  value={employerName}
                  onChange={(event) => setEmployerName(event.target.value)}
                />
              </label>
            </div>
          </section>

          {message?.type === "error" && (
            <p
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Your application will be sent to staff for review.
            </p>
            <Button
              type="submit"
              isDisabled={isPending || !session?.user?.id || isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
              <ArrowRight size={18} />
            </Button>
          </div>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
                <HandCoins size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Application summary
                </h2>
                <p className="text-xs text-gray-500">Review your selections</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 border-t border-blue-100 pt-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Loan type</span>
                <span className="text-right font-semibold text-gray-900">
                  {loanType}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Amount requested</span>
                <span className="font-semibold text-gray-900">
                  {formattedAmount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Repayment period</span>
                <span className="font-semibold text-gray-900">
                  {termMonths} months
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Employment</span>
                <span className="text-right font-semibold text-gray-900">
                  {employmentStatus}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-teal-700" size={20} />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Information notice
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your application is stored for staff review. Submission does
                  not guarantee loan approval.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}