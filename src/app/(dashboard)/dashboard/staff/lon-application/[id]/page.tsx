import { Suspense } from "react";
import { notFound } from "next/navigation";
import StaffLoanApplicationDetail from "@/Component/StaffLoanApplicationDetail";
import { getLoanApplicationById } from "@/lib/data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function LoanApplicationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getLoanApplicationById(id);
  if (!isRecord(result)) notFound();

  return <StaffLoanApplicationDetail application={result} />;
}

export default function StaffLoanApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
          Loading loan application...
        </div>
      }
    >
      <LoanApplicationContent params={params} />
    </Suspense>
  );
}
