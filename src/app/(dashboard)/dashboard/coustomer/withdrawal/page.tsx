"use client";

import type { FormEvent } from "react";
import { Button, Input } from "@heroui/react";
import {
  ArrowUpFromLine,
  Banknote,
  Building2,
  CircleHelp,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  addTransaction,
  type WithdrawalData,
  type WithdrawalMethod,
} from "@/lib/action";
import { getAccountByUserId, type UserAccount } from "@/lib/data";
import ActionSuccessPage from "@/Component/ActionSuccessPage";

const withdrawalMethods = [
  {
    name: "Cash at branch",
    description: "Collect from a branch",
    icon: Banknote,
  },
  {
    name: "Bank transfer",
    description: "Transfer to another bank",
    icon: Building2,
  },
  {
    name: "Mobile banking",
    description: "Receive in a mobile wallet",
    icon: Smartphone,
  },
] as const;

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] =
    useState<WithdrawalMethod>("Cash at branch");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [ownAccount, setOwnAccount] = useState<UserAccount | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    amount: number;
    method: WithdrawalMethod;
    accountNumber: string;
    referenceNumber: string;
  } | null>(null);
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userId = session?.user?.id;

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

    const withdrawalData: WithdrawalData = {
      userId,
      paymentType: 'withdrawal',
      accountNumber: ownAccount.accountNumber,
      amount: Number(amount),
      withdrawalMethod,
      referenceNumber: referenceNumber.trim(),
      ...(withdrawalMethod === "Bank transfer"
        ? {
            bankName: bankName.trim(),
            bankAccountName: bankAccountName.trim(),
            bankAccountNumber: bankAccountNumber.trim(),
          }
        : {}),
      ...(withdrawalMethod === "Mobile banking"
        ? { mobileNumber: mobileNumber.trim() }
        : {}),
    };

    setIsSubmitting(true);
    setSubmissionError("");
    setSubmissionSuccess(null);

    try {
      await addTransaction(withdrawalData);
      setSubmissionSuccess(
        {
          amount: withdrawalData.amount,
          method: withdrawalMethod,
          accountNumber: withdrawalData.accountNumber,
          referenceNumber: withdrawalData.referenceNumber,
        },
      );
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Could not submit the withdrawal request",
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

  const accountStatus = isSessionPending
    ? "Checking your session..."
    : isAccountLoading
      ? "Loading your account..."
      : !userId
        ? "Sign in to load your account"
        : ownAccount?.accountNumber ||
          (ownAccount
            ? "Account found, but no account number is assigned"
            : "No bank account is linked to this profile");

  if (submissionSuccess) {
    return (
      <ActionSuccessPage
        title="Withdrawal request submitted"
        description="Your withdrawal request was saved and sent to staff for review. The balance will update after it is approved."
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
            <ArrowUpFromLine size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-100">
              Customer dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Withdraw Money
            </h1>
            <p className="mt-1 text-sm text-white/75">
              Request money from your own bank account.
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
              Withdrawal details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose how you would like to receive your withdrawal.
            </p>
          </div>

          <section
            aria-label="Withdrawal account"
            className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Withdrawing from your account
            </p>
            <p className="mt-1 font-semibold text-gray-900">{accountStatus}</p>
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
          </section>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">
              Withdrawal method
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {withdrawalMethods.map(({ name, description, icon: Icon }) => (
                <label
                  key={name}
                  className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition ${
                    withdrawalMethod === name
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="withdrawalMethod"
                    value={name}
                    checked={withdrawalMethod === name}
                    onChange={() => setWithdrawalMethod(name)}
                  />
                  <Icon
                    size={21}
                    className={
                      withdrawalMethod === name
                        ? "text-blue-700"
                        : "text-gray-500"
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

          {withdrawalMethod === "Bank transfer" && (
            <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Destination bank account
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the account where you want to receive the funds.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium text-gray-700">
                  Bank name
                  <Input
                    aria-label="Destination bank name"
                    autoComplete="organization"
                    className="w-full"
                    name="bankName"
                    placeholder="e.g. Apex Bank"
                    required
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-700">
                  Account holder name
                  <Input
                    aria-label="Destination account holder name"
                    autoComplete="name"
                    className="w-full"
                    name="bankAccountName"
                    placeholder="Name on the bank account"
                    required
                    value={bankAccountName}
                    onChange={(event) =>
                      setBankAccountName(event.target.value)
                    }
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                  Bank account number
                  <Input
                    aria-label="Destination bank account number"
                    autoComplete="off"
                    className="w-full"
                    inputMode="numeric"
                    name="bankAccountNumber"
                    placeholder="Enter bank account number"
                    required
                    type="text"
                    value={bankAccountNumber}
                    onChange={(event) =>
                      setBankAccountNumber(event.target.value)
                    }
                  />
                </label>
              </div>
            </section>
          )}

          {withdrawalMethod === "Mobile banking" && (
            <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Mobile wallet details
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the mobile number linked to your wallet.
                </p>
              </div>
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                Mobile number
                <Input
                  aria-label="Mobile wallet number"
                  autoComplete="tel"
                  className="w-full"
                  inputMode="tel"
                  name="mobileNumber"
                  placeholder="01XXXXXXXXX"
                  required
                  type="tel"
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                />
              </label>
            </section>
          )}

          <label className="block space-y-2 text-sm font-medium text-gray-700">
            Withdrawal amount (BDT)
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ৳
              </span>
              <Input
                aria-label="Withdrawal amount in BDT"
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
            Reference or note
            <Input
              aria-label="Reference or note"
              className="w-full"
              name="referenceNumber"
              placeholder="Optional reference"
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
            />
          </label>

          <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-500">
            <CircleHelp className="mt-0.5 shrink-0 text-blue-600" size={16} />
            <p>
              This request is saved for review. It does not transfer money
              automatically.
            </p>
          </div>

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
              <ArrowUpFromLine size={18} />
              {isSubmitting ? "Submitting..." : "Submit withdrawal request"}
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Withdrawal summary
              </h2>
              <p className="text-xs text-gray-500">Review your request</p>
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
            <span className="text-right font-semibold text-gray-900">
              {withdrawalMethod}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Your account</span>
            <span className="max-w-40 truncate font-semibold text-gray-900">
              {ownAccount?.accountNumber ||
                (ownAccount ? "Not assigned" : "Unavailable")}
            </span>
          </div>
          <p className="mt-6 rounded-xl bg-white p-3 text-xs leading-5 text-gray-500">
            Your account number is loaded from your signed-in customer profile
            and cannot be changed here.
          </p>
        </aside>
      </div>
    </main>
  );
}