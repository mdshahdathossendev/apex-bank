import GetAllTransactions from "@/Component/GetAllTransaction";
import { getAllTranactions } from "@/lib/data";
const AllTransactionPage = async () => {
  const data = await getAllTranactions();
  return <GetAllTransactions data={data} />;
};

export default AllTransactionPage;