import AccountDetls from "@/Component/AccountDetls";
import { getUserById } from "@/lib/data";
import Link from "next/link";

export default async function AccountDetailes({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await getUserById(id);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          No bank account found
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This customer has not opened a bank account yet.
        </p>
        <Link
          href="/dashboard/staff/all-users"
          className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Back to customers
        </Link>
      </section>
    );
  }

  return (
    <AccountDetls data={data} />
  );
}