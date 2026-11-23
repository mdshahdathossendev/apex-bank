import { Building2, MapPin, ShieldCheck, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TransactionPinSetup from "@/Component/TransactionPinSetup";
import type { CustomerAccountSummary } from "@/lib/data";

interface MyBankAccountData {
  userId?: string;
  accountNumber?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  occupation?: string;
  nidNumber?: string;
  presentAddress?: string;
  permanentAddress?: string;
  accountType?: string;
  branchId?: string;
  initialDeposit?: number | string;
  balance?: number | string;
  transactionPinConfigured?: boolean;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value) ?? String(value);
  }

  return String(value);
}

function formatCurrency(value: unknown): string {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) return "Not recorded";

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function DetailSection({
  icon: Icon,
  title,
  fields,
}: {
  icon: LucideIcon;
  title: string;
  fields: { label: string; value: unknown }[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <Icon size={20} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {field.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
              {formatValue(field.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function MyBankAccount({
  data,
  accounts = [],
}: {
  data: MyBankAccountData | null;
  accounts?: CustomerAccountSummary[];
}) {
  if (!data) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <Wallet className="mx-auto text-gray-400" size={32} />
        <h1 className="mt-3 text-xl font-semibold text-gray-900">
          No bank account found
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account information will appear here once an account is created.
        </p>
      </section>
    );
  }

  const depositAmount = Number(data.initialDeposit);
  const initialDeposit =
    data.initialDeposit === undefined || !Number.isFinite(depositAmount)
      ? "Not provided"
      : new Intl.NumberFormat("en-BD", {
          style: "currency",
          currency: "BDT",
          maximumFractionDigits: 2,
        }).format(depositAmount);
  const currentBalance = formatCurrency(data.balance ?? data.initialDeposit);
  const accountsNeedingPinSetup =
    accounts.length > 0
      ? accounts.filter(
          (
            account,
          ): account is CustomerAccountSummary & { accountNumber: string } =>
            typeof account.accountNumber === "string" &&
            !account.transactionPinConfigured,
        )
      : data.accountNumber && data.transactionPinConfigured !== true
        ? [
            {
              accountNumber: data.accountNumber,
              accountType: data.accountType,
            },
          ]
        : [];

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Customer dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          My Bank Account
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your account and personal information.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute -right-2 -top-8 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3">
                <Building2 size={24} />
              </div>
              <div>
                <p className="font-bold tracking-wide">APEX BANK</p>
                <p className="text-xs text-white/70">Personal Banking</p>
              </div>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
              {data.accountType || "Bank account"}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">
              Account number
            </p>
            <p className="mt-2 break-all text-xl font-semibold tracking-widest sm:text-2xl">
              {data.accountNumber || "Not provided"}
            </p>
          </div>

          <div className="mt-8 grid gap-5 border-t border-white/15 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Account holder
              </p>
              <p className="mt-1 font-semibold">
                {data.name || "Account holder"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Initial deposit
              </p>
              <p className="mt-1 text-lg font-semibold">{initialDeposit}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Current balance
              </p>
              <p className="mt-1 text-lg font-semibold">{currentBalance}</p>
            </div>
          </div>
        </div>
      </section>

      {accountsNeedingPinSetup.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction PIN setup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Set a 4-digit PIN for each account opened before PINs were
              introduced.
            </p>
          </div>
          {accountsNeedingPinSetup.map((account) => (
            <div
              key={account.accountNumber}
              className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-gray-700">
                {account.accountType || "Account"} · {account.accountNumber}
              </p>
              <TransactionPinSetup accountNumber={account.accountNumber} />
            </div>
          ))}
        </section>
      ) : null}

      <DetailSection
        icon={ShieldCheck}
        title="Account information"
        fields={[
          { label: "Account type", value: data.accountType },
          { label: "Account number", value: data.accountNumber },
          { label: "Branch ID", value: data.branchId },
          { label: "Initial deposit", value: initialDeposit },
          { label: "Current balance", value: currentBalance },
          { label: "Customer ID", value: data.userId },
        ]}
      />

      <DetailSection
        icon={UserRound}
        title="Personal information"
        fields={[
          { label: "Name", value: data.name },
          { label: "Father's name", value: data.fatherName },
          { label: "Mother's name", value: data.motherName },
          { label: "Date of birth", value: data.dateOfBirth },
          { label: "Gender", value: data.gender },
          { label: "Nationality", value: data.nationality },
          { label: "Marital status", value: data.maritalStatus },
          { label: "Occupation", value: data.occupation },
          { label: "NID number", value: data.nidNumber },
        ]}
      />

      <DetailSection
        icon={MapPin}
        title="Address information"
        fields={[
          { label: "Present address", value: data.presentAddress },
          { label: "Permanent address", value: data.permanentAddress },
        ]}
      />
    </main>
  );
}
