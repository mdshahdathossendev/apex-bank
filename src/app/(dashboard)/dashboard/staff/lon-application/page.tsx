
import { Suspense } from "react";
import { getAllLoanApplications } from "@/lib/data";
import StaffAllLoanApplications from "@/Component/StaffAllLonApplication";

async function LoanApplicationsContent() {
  const loanApplications = await getAllLoanApplications();
  return (
    <StaffAllLoanApplications loanApplications={loanApplications} />
  );
}

export default function LoanApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
          Loading loan applications...
        </div>
      }
    >
      <LoanApplicationsContent />
    </Suspense>
  );
}