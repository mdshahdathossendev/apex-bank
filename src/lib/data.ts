export async function allUserData() {
  const response = await fetch("http://localhost:4000/api/users", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return recordsFromResponse(await response.json(), "users");
}
export async function getUserById(userId: string) {
  const response = await fetch(`http://localhost:4000/api/application/${userId}`, {
    cache: "no-store",
  });
  return response.json();
};

export interface UserAccount {
  accountNumber?: string;
  accountType?: string;
  status?: string;
  isActive?: boolean;
}

export interface CustomerAccountSummary extends UserAccount {
  initialDeposit?: number;
  balance?: number;
  transactionPinConfigured?: boolean;
}

export interface BankAccountSummary {
  userId?: string;
  accountNumber: string;
  name?: string;
  accountType?: string;
  branchId?: string;
  status: string;
  initialDeposit?: number;
  balance?: number;
}

export interface CustomerTransactionSummary {
  _id?: string;
  paymentType?: string;
  statuses?: string;
  amount?: number;
  depositMethod?: string;
  withdrawalMethod?: string;
  referenceNumber?: string;
  accountNumber?: string;
  transferDirection?: string;
  createdAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordsFromResponse(data: unknown, resource: string) {
  if (!Array.isArray(data) || data.some((item) => !isRecord(item))) {
    throw new Error(`The ${resource} API returned an invalid response`);
  }

  return data.filter(isRecord);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalAmount(value: unknown): number | undefined {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

export async function getAccountByUserId(
  userId: string,
): Promise<UserAccount | null> {
  const response = await fetch(
    `http://localhost:4000/api/application/${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Could not load your account (${response.status})`);
  }

  const data: unknown = await response.json();
  if (data === null) return null;
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The account API returned an invalid response");
  }

  const record = data as Record<string, unknown>;
  return {
    accountNumber:
      typeof record.accountNumber === "string"
        ? record.accountNumber
        : undefined,
    accountType:
      typeof record.accountType === "string" ? record.accountType : undefined,
  };
}

export async function getCustomerAccountsByUserId(
  userId: string,
): Promise<CustomerAccountSummary[]> {
  const response = await fetch(
    `http://localhost:4000/api/accounts/${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Could not load your accounts (${response.status})`);
  }

  const records = recordsFromResponse(await response.json(), "accounts");
  return records.map((record) => ({
    accountNumber: optionalString(record.accountNumber),
    accountType: optionalString(record.accountType),
    initialDeposit: optionalAmount(record.initialDeposit),
    balance: optionalAmount(record.balance),
    status: optionalString(record.status),
    isActive: optionalBoolean(record.isActive),
    transactionPinConfigured: record.transactionPinConfigured === true,
  }));
}

function amountInCents(value: unknown): number | null {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function isSuccessfulTransaction(record: Record<string, unknown>): boolean {
  const status = String(record.statuses ?? record.status ?? "").toLowerCase();
  return (
    status.includes("success") ||
    status.includes("complete") ||
    status.includes("approved")
  );
}

export async function getAllBankAccounts(): Promise<BankAccountSummary[]> {
  const [accountsResponse, transactionsResponse] = await Promise.all([
    fetch("http://localhost:4000/api/application", { cache: "no-store" }),
    fetch("http://localhost:4000/api/transactions", { cache: "no-store" }),
  ]);
  if (!accountsResponse.ok) {
    throw new Error(`Could not load bank accounts (${accountsResponse.status})`);
  }
  if (!transactionsResponse.ok) {
    throw new Error(
      `Could not load transactions for account balances (${transactionsResponse.status})`,
    );
  }

  const accountRecords = recordsFromResponse(
    await accountsResponse.json(),
    "accounts",
  );
  const transactionRecords = recordsFromResponse(
    await transactionsResponse.json(),
    "transactions",
  );
  const transactionTotals = new Map<string, number>();

  for (const transaction of transactionRecords) {
    if (!isSuccessfulTransaction(transaction)) continue;
    const accountNumber = optionalString(transaction.accountNumber);
    const amount = amountInCents(transaction.amount);
    if (!accountNumber || amount === null || amount <= 0) continue;

    const paymentType = String(transaction.paymentType ?? "").toLowerCase();
    let delta = 0;
    if (paymentType === "deposit") delta = amount;
    if (paymentType === "withdrawal") delta = -amount;
    if (paymentType === "transfer") {
      if (transaction.transferDirection === "sent") delta = -amount;
      if (transaction.transferDirection === "received") delta = amount;
    }
    if (delta !== 0) {
      transactionTotals.set(
        accountNumber,
        (transactionTotals.get(accountNumber) ?? 0) + delta,
      );
    }
  }

  return accountRecords.flatMap((record) => {
    const accountNumber = optionalString(record.accountNumber)?.trim();
    if (!accountNumber) return [];

    const initialDeposit = optionalAmount(record.initialDeposit);
    const storedBalance = optionalAmount(record.balance);
    const openingBalanceCents = amountInCents(record.initialDeposit) ?? 0;
    const balance =
      storedBalance ??
      (openingBalanceCents +
        (transactionTotals.get(accountNumber) ?? 0)) /
        100;
    const storedStatus = optionalString(record.status)?.trim();
    const status =
      record.isActive === false
        ? "inactive"
        : storedStatus || "active";

    return [
      {
        userId: optionalString(record.userId),
        accountNumber,
        name: optionalString(record.name),
        accountType: optionalString(record.accountType),
        branchId: optionalString(record.branchId),
        status,
        initialDeposit,
        balance,
      },
    ];
  });
}

export async function getCustomerTransactionsByUserId(
  userId: string,
): Promise<CustomerTransactionSummary[]> {
  const response = await fetch(
    `http://localhost:4000/api/transactions/${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Could not load your transactions (${response.status})`);
  }

  const records = recordsFromResponse(await response.json(), "transactions");
  return records.map((record) => ({
    _id: optionalString(record._id),
    paymentType: optionalString(record.paymentType),
    statuses: optionalString(record.statuses),
    amount: optionalAmount(record.amount),
    depositMethod: optionalString(record.depositMethod),
    withdrawalMethod: optionalString(record.withdrawalMethod),
    referenceNumber: optionalString(record.referenceNumber),
    accountNumber: optionalString(record.accountNumber),
    transferDirection: optionalString(record.transferDirection),
    createdAt: optionalString(record.createdAt),
  }));
}

export async function getTranactionsById(id : any) {
  const response = await  fetch(`http://localhost:4000/api/transactions/${id}`, {
        cache: "no-store",
    });
    return response.json();
};
export async function getAllTranactions(): Promise<Record<string, unknown>[]> {
  const response = await fetch("http://localhost:4000/api/transactions", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load transactions (${response.status})`);
  }
  const data: unknown = await response.json();
  return recordsFromResponse(data, "transactions");
};

export async function getAllLoanApplications() {
  const response = await fetch("http://localhost:4000/api/loan-application-staff", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load loan applications (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The loan applications API returned an invalid response");
  }
  return data;
};

export async function getAllAdminLoanApplications(): Promise<
  Record<string, unknown>[]
> {
  const response = await fetch(
    "http://localhost:4000/api/loan-application-admin",
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(
      `Could not load admin loan application notes (${response.status})`,
    );
  }

  const data: unknown = await response.json();
  return recordsFromResponse(data, "admin loan applications");
}

export async function getLoanApplicationById(id: string): Promise<unknown> {
  const response = await fetch(
    `http://localhost:4000/api/loan-application-staff/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Could not load loan application (${response.status})`);
  }
  return response.json();
}

export interface StaffDashboardData {
  users: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  loanApplications: Record<string, unknown>[];
}

async function fetchStaffRecords(
  endpoint: string,
  resource: string,
): Promise<Record<string, unknown>[]> {
  const response = await fetch(`http://localhost:4000${endpoint}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load ${resource} (${response.status})`);
  }
  return recordsFromResponse(await response.json(), resource);
}

export async function getStaffDashboardData(): Promise<StaffDashboardData> {
  const [users, accounts, transactions, loanApplications] = await Promise.all([
    fetchStaffRecords("/api/users", "users"),
    fetchStaffRecords("/api/application", "accounts"),
    fetchStaffRecords("/api/transactions", "transactions"),
    fetchStaffRecords("/api/loan-application-staff", "loan applications"),
  ]);
  return { users, accounts, transactions, loanApplications };
}
