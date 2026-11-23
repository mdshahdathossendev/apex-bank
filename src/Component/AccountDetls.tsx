import type { ReactNode } from "react";
import type { AccountData } from "@/lib/action";

interface AccountDetlsProps {
  data: AccountData;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value === "" ? "Not provided" : value}
      </dd>
    </div>
  );
}

function DetailsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

export default function AccountDetls({ data }: AccountDetlsProps) {
  const initialDeposit = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(data.initialDeposit);
  const currentBalance = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(data.balance ?? data.initialDeposit);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-100">
          Account profile
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Account Details
        </h1>
        <p className="mt-1 text-blue-100">{data.name || "Account holder"}</p>

        <div className="mt-7 grid gap-5 border-t border-white/20 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">
              Account number
            </p>
            <p className="mt-1 font-semibold">
              {data.accountNumber || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">
              Account type
            </p>
            <p className="mt-1 font-semibold">
              {data.accountType || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">
              Initial deposit
            </p>
            <p className="mt-1 font-semibold">{initialDeposit}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">
              Current balance
            </p>
            <p className="mt-1 font-semibold">{currentBalance}</p>
          </div>
        </div>
      </header>

      <DetailsSection title="Personal information">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Name" value={data.name} />
          <DetailItem label="Customer ID" value={data.userId} />
          <DetailItem label="Father's name" value={data.fatherName} />
          <DetailItem label="Mother's name" value={data.motherName} />
          <DetailItem label="Date of birth" value={data.dateOfBirth} />
          <DetailItem label="Gender" value={data.gender} />
          <DetailItem label="Nationality" value={data.nationality} />
          <DetailItem label="Marital status" value={data.maritalStatus} />
          <DetailItem label="Occupation" value={data.occupation} />
          <DetailItem label="NID number" value={data.nidNumber} />
        </dl>
      </DetailsSection>

      <DetailsSection title="Banking and address information">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Branch ID" value={data.branchId} />
          <DetailItem label="Account type" value={data.accountType} />
          <DetailItem label="Current balance" value={currentBalance} />
          <DetailItem label="Present address" value={data.presentAddress} />
          <DetailItem label="Permanent address" value={data.permanentAddress} />
        </dl>
      </DetailsSection>
    </main>
  );
}
