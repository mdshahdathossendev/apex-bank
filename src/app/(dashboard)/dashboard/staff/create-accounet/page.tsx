"use client";

import type { FormEvent } from "react";
import { createAccount, type CreateAccountInput } from "@/lib/action";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export default function CreateAccountPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const { data: session, isPending } = authClient.useSession();
  const name = session?.user?.name ?? "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const accountData: CreateAccountInput = {
      userId: customerId || "",
      name: name,
      fatherName: String(formData.get("fatherName") ?? ""),
      motherName: String(formData.get("motherName") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      nationality: String(formData.get("nationality") ?? ""),
      maritalStatus: String(formData.get("maritalStatus") ?? ""),
      occupation: String(formData.get("occupation") ?? ""),
      nidNumber: String(formData.get("nidNumber") ?? ""),
      presentAddress: String(formData.get("presentAddress") ?? ""),
      permanentAddress: String(formData.get("permanentAddress") ?? ""),
      accountType: String(formData.get("accountType") ?? ""),
      branchId: String(formData.get("branchId") ?? ""),
      initialDeposit: Number(formData.get("initialDeposit") ?? 0),
      transactionPin: String(formData.get("transactionPin") ?? ""),
      transactionPinConfirmation: String(
        formData.get("transactionPinConfirmation") ?? "",
      ),
    };

    try {
      const result = await createAccount(accountData);
      alert(`Account created successfully. Account number: ${result.accountNumber}`);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Account creation failed",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the customer and account information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Name
              <input
                name="name"
                value={name}
                readOnly
                required
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Father&apos;s Name
              <input
                name="fatherName"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Mother&apos;s Name
              <input
                name="motherName"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Date of Birth
              <input
                name="dateOfBirth"
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Gender
              <select
                name="gender"
                defaultValue="MALE"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Nationality
              <input
                name="nationality"
                defaultValue="Bangladeshi"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Marital Status
              <select
                name="maritalStatus"
                defaultValue="SINGLE"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Occupation
              <input
                name="occupation"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              NID Number
              <input
                name="nidNumber"
                inputMode="numeric"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Present Address
              <textarea
                name="presentAddress"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Permanent Address
              <textarea
                name="permanentAddress"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Bank Account Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Account Type
              <select
                name="accountType"
                defaultValue="SAVINGS"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
                <option value="BUSINESS">Business</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Branch ID
              <input
                name="branchId"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Initial Deposit (BDT)
              <input
                name="initialDeposit"
                type="number"
                min="0"
                defaultValue="0"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Transaction PIN (4 digits)
              <input
                name="transactionPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Confirm Transaction PIN
              <input
                name="transactionPinConfirmation"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !name}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}