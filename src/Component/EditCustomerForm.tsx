"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerPersonalData } from "@/lib/action";
import type { CustomerPersonalDataUpdate } from "@/lib/action";

export default function EditCustomerForm({
  userId,
  initialData,
}: {
  userId: string;
  initialData: CustomerPersonalDataUpdate;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const updatedData: CustomerPersonalDataUpdate = {
      name: String(formData.get("name") ?? ""),
      fatherName: String(formData.get("fatherName") ?? ""),
      motherName: String(formData.get("motherName") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      nidNumber: String(formData.get("nidNumber") ?? ""),
      presentAddress: String(formData.get("presentAddress") ?? ""),
      permanentAddress: String(formData.get("permanentAddress") ?? ""),
    };

    try {
      const result = await updateCustomerPersonalData(userId, updatedData);
      setMessage(result.message);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Customer information could not be updated",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Personal information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Full name
            <input
              name="name"
              defaultValue={initialData.name}
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Father&apos;s name
            <input
              name="fatherName"
              defaultValue={initialData.fatherName}
              maxLength={120}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Mother&apos;s name
            <input
              name="motherName"
              defaultValue={initialData.motherName}
              maxLength={120}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={initialData.dateOfBirth}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Gender
            <select
              name="gender"
              defaultValue={initialData.gender || "OTHER"}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            NID number
            <input
              name="nidNumber"
              inputMode="numeric"
              defaultValue={initialData.nidNumber}
              maxLength={32}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Address information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Present address
            <textarea
              name="presentAddress"
              defaultValue={initialData.presentAddress}
              maxLength={500}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Permanent address
            <textarea
              name="permanentAddress"
              defaultValue={initialData.permanentAddress}
              maxLength={500}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving changes..." : "Save customer details"}
        </button>
        {message ? (
          <p role="status" className="text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
