"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, ShieldCheck } from "lucide-react";
import { transferFunds } from "@/lib/action";
import type { CustomerAccountSummary } from "@/lib/data";

const MAX_TRANSFER_AMOUNT = 20_000;

function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "Balance unavailable";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
}

function accountIsActive(account: CustomerAccountSummary): boolean {
  return (
    account.isActive !== false &&
    (!account.status || account.status.toLowerCase() === "active")
  );
}

export default function TransferForm({
  accounts,
}: {
  accounts: CustomerAccountSummary[];
}) {
  const router = useRouter();
  const [sourceAccountNumber, setSourceAccountNumber] = useState(
    accounts.find(accountIsActive)?.accountNumber ?? "",
  );
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceAccount = accounts.find(
    (account) => account.accountNumber === sourceAccountNumber,
  );
  const usableAccounts = accounts.filter(
    (account) => account.accountNumber && accountIsActive(account),
  );
  const ownRecipientAccounts = usableAccounts.filter(
    (account) => account.accountNumber !== sourceAccountNumber,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult("");
    setIsSubmitting(true);

    try {
      const transfer = await transferFunds({
        sourceAccountNumber,
        recipientAccountNumber,
        amount,
        description,
        transactionPin,
      });
      setResult(
        `Transfer complete. Transaction ID: ${transfer.transactionId}`,
      );
      setTransactionPin("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The transfer could not be completed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-700">Customer banking</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Fund transfer
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Transfer instantly between your accounts or to another Apex Bank
          customer.
        </p>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            Transfers are completed immediately after validation. The maximum
            is ৳20,000 per transfer and ৳20,000 per account per Bangladesh
            calendar day.
          </p>
        </div>
      </section>

      {accounts.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <h2 className="font-semibold text-gray-900">No bank account found</h2>
          <p className="mt-1 text-sm text-gray-500">
            A bank account is required before you can transfer money.
          </p>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <label className="block space-y-1 text-sm font-medium text-gray-700">
            Transfer from
            <select
              value={sourceAccountNumber}
              onChange={(event) => setSourceAccountNumber(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
            >
              <option value="" disabled>
                Select your account
              </option>
              {accounts.map((account) => (
                <option
                  key={account.accountNumber}
                  value={account.accountNumber}
                  disabled={!accountIsActive(account)}
                >
                  {account.accountType || "Account"} · {account.accountNumber}
                  {accountIsActive(account) ? "" : " · Inactive"}
                </option>
              ))}
            </select>
            {sourceAccount ? (
              <span className="block text-xs font-normal text-gray-500">
                Available balance: {formatCurrency(sourceAccount.balance)}
              </span>
            ) : null}
          </label>

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            Recipient account number
            <input
              value={recipientAccountNumber}
              onChange={(event) => setRecipientAccountNumber(event.target.value)}
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              autoComplete="off"
              required
              placeholder="Enter the 10-digit account number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </label>

          {ownRecipientAccounts.length > 0 ? (
            <div className="-mt-3">
              <p className="text-xs font-medium text-gray-500">
                Or choose one of your other accounts:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ownRecipientAccounts.map((account) => (
                  <button
                    key={account.accountNumber}
                    type="button"
                    onClick={() =>
                      setRecipientAccountNumber(account.accountNumber ?? "")
                    }
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    {account.accountType || "Account"} ·{" "}
                    {account.accountNumber}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            Transfer amount (BDT)
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="1"
              max={MAX_TRANSFER_AMOUNT}
              step="0.01"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={120}
              required
              placeholder="What is this transfer for?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            Transaction PIN
            <input
              type="password"
              value={transactionPin}
              onChange={(event) =>
                setTransactionPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              autoComplete="off"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
            <span className="block text-xs font-normal text-gray-500">
              Use the 4-digit PIN set during account registration.
            </span>
          </label>

          {sourceAccount && !sourceAccount.transactionPinConfigured ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This account needs a transaction PIN before transfers can be
              made.{" "}
              <Link
                href="/dashboard/coustomer/my-account"
                className="font-semibold underline"
              >
                Set it in My Account
              </Link>
              .
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !sourceAccount ||
              !accountIsActive(sourceAccount) ||
              !sourceAccount.transactionPinConfigured
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeftRight size={18} />
            {isSubmitting ? "Transferring..." : "Transfer money"}
          </button>

          {result ? (
            <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              {result}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </main>
  );
}
