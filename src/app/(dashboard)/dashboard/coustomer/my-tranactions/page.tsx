import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTranactionsById } from "@/lib/data";
import MyTransactionss from "@/Component/myTransctionss";
const myTransactions   = async () => {
    const session = await auth.api.getSession({
    headers: await headers(),
  });
     const userId =session?.user?.id;
const data = await getTranactionsById(userId);
console.log("User Data:", data); 
    return (
       <>
       <MyTransactionss data={data} />
       </>
    );
}
export default myTransactions;