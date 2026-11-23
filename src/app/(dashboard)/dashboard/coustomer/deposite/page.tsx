"use client";

import type { FormEvent } from "react";
import { Button, Input } from "@heroui/react";
import { ArrowDownToLine, Banknote, Building2, Smartphone, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getAccountByUserId, type UserAccount } from "@/lib/data";
import { addTransaction } from "@/lib/action";
import ActionSuccessPage from "@/Component/ActionSuccessPage";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    amount: number;
    method: string;
    accountNumber: string;
    referenceNumber: string;
  } | null>(null);
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const [ownAccount, setOwnAccount] = useState<UserAccount | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    if (!userId) {
      setOwnAccount(null);
      setIsAccountLoading(false);
      return;
    }

    let active = true;
    setOwnAccount(null);
    setIsAccountLoading(true);
    setAccountError("");

    getAccountByUserId(userId)
      .then((account) => {
        if (active) setOwnAccount(account);
      })
      .catch((error: unknown) => {
        if (active) {
          setAccountError(
            error instanceof Error ? error.message : "Could not load your account",
          );
        }
      })
      .finally(() => {
        if (active) setIsAccountLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId || !ownAccount?.accountNumber || isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const depositData = {
      userId,
      accountNumber: ownAccount.accountNumber,
      amount: Number(formData.get("amount") ?? 0),
      depositMethod: String(formData.get("depositMethod") ?? ""),
      referenceNumber: String(formData.get("referenceNumber") ?? ""),
      paymentType: "deposit",
    };

    setIsSubmitting(true);
    setSubmissionError("");
    setSubmissionSuccess(null);
    try {
      await addTransaction(depositData);
      setSubmissionSuccess({
        amount: depositData.amount,
        method: depositData.depositMethod,
        accountNumber: depositData.accountNumber,
        referenceNumber: depositData.referenceNumber,
      });
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Could not submit the deposit request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountValue = Number(amount);
  const formattedAmount =
    amount && Number.isFinite(amountValue)
      ? new Intl.NumberFormat("en-BD", {
          style: "currency",
          currency: "BDT",
          maximumFractionDigits: 2,
        }).format(amountValue)
      : "৳0.00";

  const depositMethods = [
    { name: "Cash", description: "At a bank branch", icon: Banknote },
    { name: "Bank Transfer", description: "From another bank", icon: Building2 },
    { name: "Mobile Banking", description: "Wallet or mobile app", icon: Smartphone },
  ];

  if (submissionSuccess) {
    return (
      <ActionSuccessPage
        title="Deposit request submitted"
        description="Your deposit request was saved and sent to staff for review. The balance will update after it is approved."
        details={[
          {
            label: "Amount",
            value: new Intl.NumberFormat("en-BD", {
              style: "currency",
              currency: "BDT",
              maximumFractionDigits: 2,
            }).format(submissionSuccess.amount),
          },
          { label: "Method", value: submissionSuccess.method },
          { label: "Account", value: submissionSuccess.accountNumber },
          ...(submissionSuccess.referenceNumber.trim()
            ? [
                {
                  label: "Reference",
                  value: submissionSuccess.referenceNumber.trim(),
                },
              ]
            : []),
        ]}
        primaryLabel="View my transactions"
        primaryHref="/dashboard/coustomer/my-tranactions"
        secondaryHref="/dashboard/coustomer"
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-2xl bg-white/15 p-3">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-100">Customer dashboard</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Deposit Money</h1>
            <p className="mt-1 text-sm text-white/75">
              Add funds to your bank account.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Deposit details
            </h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose a method and enter the deposit information.
              </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Depositing to your account
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {isSessionPending
                  ? "Checking your session..."
                  : isAccountLoading
                    ? "Loading your account..."
                    : !userId
                      ? "Sign in to load your account"
                      : ownAccount?.accountNumber ||
                        (ownAccount
                          ? "Account found, but no account number is assigned"
                          : "No bank account is linked to this profile")}
              </p>
              {ownAccount?.accountType && (
                <p className="mt-1 text-xs text-gray-500">
                  {ownAccount.accountType} account
                </p>
              )}
              {accountError && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {accountError}
                </p>
              )}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">
              Deposit Method
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {depositMethods.map(({ name, description, icon: Icon }) => (
                <label
                  key={name}
                  className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition ${
                    depositMethod === name
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="depositMethod"
                    value={name}
                    checked={depositMethod === name}
                    onChange={() => setDepositMethod(name)}
                  />
                  <Icon
                    size={21}
                    className={
                      depositMethod === name ? "text-blue-700" : "text-gray-500"
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      {name}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-2 text-sm font-medium text-gray-700">
            Deposit Amount (BDT)
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ৳
              </span>
              <Input
                aria-label="Deposit amount in BDT"
                className="w-full pl-8"
                min="1"
                name="amount"
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm font-medium text-gray-700">
            Reference Number
            <Input
              aria-label="Reference number"
              className="w-full"
              name="referenceNumber"
              placeholder="Optional transaction reference"
            />
          </label>

          {submissionError && (
            <p className="text-sm text-red-700" role="alert">
              {submissionError}
            </p>
          )}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <Button
              type="submit"
              isDisabled={
                isSessionPending ||
                isAccountLoading ||
                isSubmitting ||
                !ownAccount?.accountNumber
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              <ArrowDownToLine size={18} />
              {isSubmitting ? "Submitting..." : "Submit Deposit"}
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Deposit summary</h2>
              <p className="text-xs text-gray-500">Review before submitting</p>
            </div>
          </div>
          <div className="mt-6 border-t border-blue-100 pt-5">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formattedAmount}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Method</span>
            <span className="font-semibold text-gray-900">{depositMethod}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Your account</span>
            <span className="max-w-40 truncate font-semibold text-gray-900">
              {ownAccount?.accountNumber ||
                (ownAccount ? "Not assigned" : "Unavailable")}
            </span>
          </div>
          <p className="mt-6 rounded-xl bg-white p-3 text-xs leading-5 text-gray-500">
            Deposit will be assigned to your signed-in account. Your details
            will be shown in the browser console when you submit.
          </p>
        </aside>
      </div>
    </main>
  );
}