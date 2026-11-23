import { getCustomerAccountsByUserId, getUserById } from "@/lib/data";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import MyBankAccount from "@/Component/MyBankAccount";
const MyAccount = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user.id;
  if (!userId || session?.user.role !== "customer") {
    return <MyBankAccount data={null} />;
  }

  const [data, accounts] = await Promise.all([
    getUserById(userId),
    getCustomerAccountsByUserId(userId),
  ]);
  return <MyBankAccount data={data} accounts={accounts} />;
};

export default MyAccount;