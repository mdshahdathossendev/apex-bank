import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCustomerTransactionsByUserId } from "@/lib/data";
import MyTransactionss from "@/Component/myTransctionss";
import { redirect } from "next/navigation";

export default async function MyTransactionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") redirect("/sinin");

  const data = await getCustomerTransactionsByUserId(session.user.id);
  return <MyTransactionss data={data} />;
}