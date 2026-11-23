import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCustomerAccountsByUserId } from "@/lib/data";
import TransferForm from "@/Component/TransferForm";

export default async function TransferPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Customer access required
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in with a customer account to make a transfer.
        </p>
      </section>
    );
  }

  const accounts = await getCustomerAccountsByUserId(session.user.id);
  return <TransferForm accounts={accounts} />;
}
