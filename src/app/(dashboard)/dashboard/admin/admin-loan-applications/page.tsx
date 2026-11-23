import { headers } from "next/headers";
import AdminLoanApplications from "@/Component/AdminLoanApplications";
import { auth } from "@/lib/auth";
import {
  getAllAdminLoanApplications,
  getAllBankAccounts,
} from "@/lib/data";

export default async function AdminLoanApplicationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "admin") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Admin access required
        </h1>
      </section>
    );
  }

  const [applications, accounts] = await Promise.all([
    getAllAdminLoanApplications(),
    getAllBankAccounts(),
  ]);
  return <AdminLoanApplications data={applications} accounts={accounts} />;
}
