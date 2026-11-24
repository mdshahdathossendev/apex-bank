import { ObjectId } from "mongodb";
import Link from "next/link";
import { headers } from "next/headers";
import { CreateAccountForm } from "@/Component/CreateAccountForm";
import { auth, bankingDb } from "@/lib/auth";

function Message({ children }: { children: string }) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-gray-900">{children}</h1>
      <Link
        href="/dashboard/staff/all-users"
        className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Back to customers
      </Link>
    </section>
  );
}

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string | string[] }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "staff") {
    return <Message>Staff access required</Message>;
  }

  const params = await searchParams;
  const requestedId =
    typeof params.customerId === "string" ? params.customerId.trim() : "";
  if (!requestedId || requestedId.length > 128) {
    return <Message>Select a customer before creating an account</Message>;
  }

  const userIdClauses: Array<Record<string, unknown>> = [
    { _id: requestedId },
    { id: requestedId },
  ];
  if (ObjectId.isValid(requestedId)) {
    userIdClauses.push({ _id: new ObjectId(requestedId) });
  }
  const customer = await bankingDb.collection("user").findOne(
    { $or: userIdClauses },
    { projection: { _id: 1, id: 1, name: 1, role: 1 } },
  );
  if (!customer || customer.role !== "customer") {
    return <Message>Customer not found</Message>;
  }

  const customerId =
    customer._id instanceof ObjectId
      ? customer._id.toHexString()
      : typeof customer._id === "string"
        ? customer._id
        : typeof customer.id === "string"
          ? customer.id
          : requestedId;
  const customerName =
    typeof customer.name === "string" ? customer.name.trim() : "";
  if (!customerName) {
    return <Message>Customer name is not available</Message>;
  }

  return (
    <CreateAccountForm customerId={customerId} customerName={customerName} />
  );
}
