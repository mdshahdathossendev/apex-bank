"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setTransactionPin } from "@/lib/action";
import ActionSuccessPage from "@/Component/ActionSuccessPage";

export default function TransactionPinSetup({
  accountNumber,
}: {
  accountNumber: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await setTransactionPin(
        accountNumber,
        String(formData.get("transactionPin") ?? ""),
        String(formData.get("transactionPinConfirmation") ?? ""),
      );
      setMessage(result.message);
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The transaction PIN could not be saved",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (message) {
    return (
      <ActionSuccessPage
        title="Transaction PIN saved"
        description={message}
        details={[{ label: "Account", value: accountNumber }]}
        primaryLabel="Back to my account"
        primaryHref="/dashboard/coustomer/my-account"
        secondaryHref="/dashboard/coustomer"
      />
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Set your transaction PIN
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        This account was opened before transaction PINs were added. Set a
        one-time 4-digit PIN to authorize transfers.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-4 grid gap-4 sm:grid-cols-2"
      >
        <label className="space-y-1 text-sm font-medium text-gray-700">
          New 4-digit PIN
          <input
            name="transactionPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Confirm PIN
          <input
            name="transactionPinConfirmation"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving PIN..." : "Set transaction PIN"}
          </button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
