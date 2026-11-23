import AccountDetls from "@/Component/AccountDetls";
import { getUserById } from "@/lib/data";
export default async function AccountDetailes({params,}: {params: Promise<{ id: string }>;}) {
  const { id } = await params;

  const data = await getUserById(id);
    console.log("Fetched user data:", data.fatherName);
  return (
    <>
    <AccountDetls data={data}></AccountDetls>
    </>
  );
}