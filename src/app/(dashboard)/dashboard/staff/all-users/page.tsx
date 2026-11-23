import { Suspense } from "react";
import { allUserData } from "@/lib/data";
import { AllUserData } from "@/Component/AllUserData";

async function UserTable() {
  const data = await allUserData();

  return (
    <AllUserData data={data} />
  );
}

export default function AllUserDatas() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading users...</p>}>
      <UserTable />
    </Suspense>
  );
}