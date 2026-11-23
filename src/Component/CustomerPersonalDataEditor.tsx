import Link from "next/link";
import { headers } from "next/headers";
import EditCustomerForm from "@/Component/EditCustomerForm";
import { auth, bankingDb } from "@/lib/auth";
import type { CustomerPersonalDataUpdate } from "@/lib/action";

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return "";
}

function dateInputValue(value: unknown): string {
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function genderValue(value: unknown): string {
  const normalized = text(value).toUpperCase();
  return ["MALE", "FEMALE", "OTHER"].includes(normalized)
    ? normalized
    : "OTHER";
}

export default async function CustomerPersonalDataEditor({
  userId,
  backHref,
}: {
  userId: string;
  backHref: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "staff" && session?.user.role !== "admin") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Staff/admin access required
        </h1>
      </section>
    );
  }

  const account = await bankingDb.collection("bank-account").findOne(
    { userId },
    {
      sort: { _id: -1 },
      projection: {
        name: 1,
        fatherName: 1,
        motherName: 1,
        dateOfBirth: 1,
        gender: 1,
        nidNumber: 1,
        presentAddress: 1,
        permanentAddress: 1,
      },
    },
  );

  if (!account) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          No bank account found
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This customer has no bank account profile to update.
        </p>
        <Link
          href={backHref}
          className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Back to customers
        </Link>
      </section>
    );
  }

  const initialData: CustomerPersonalDataUpdate = {
    name: text(account.name),
    fatherName: text(account.fatherName),
    motherName: text(account.motherName),
    dateOfBirth: dateInputValue(account.dateOfBirth),
    gender: genderValue(account.gender),
    nidNumber: text(account.nidNumber),
    presentAddress: text(account.presentAddress),
    permanentAddress: text(account.permanentAddress),
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">
            Staff/admin dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Edit customer details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update personal and address information for this customer.
          </p>
        </div>
        <Link
          href={backHref}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to customers
        </Link>
      </header>
      <EditCustomerForm userId={userId} initialData={initialData} />
    </main>
  );
}
