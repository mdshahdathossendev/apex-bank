"use server";

import {
  ObjectId,
  type ClientSession,
  type Collection,
  type Document,
} from "mongodb";
import {
  randomBytes,
  randomInt,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, bankingDb, mongoClient } from "@/lib/auth";

export interface AccountData {
  userId: string;
  accountNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  occupation: string;
  nidNumber: string;
  presentAddress: string;
  permanentAddress: string;
  accountType: string;
  branchId: string;
  initialDeposit: number;
  balance?: number;
}

export interface CreateAccountInput extends Omit<
  AccountData,
  "accountNumber" | "balance" | "name"
> {
  transactionPin: string;
  transactionPinConfirmation: string;
}

export interface TransferInput {
  sourceAccountNumber: string;
  recipientAccountNumber: string;
  amount: number | string;
  description: string;
  transactionPin: string;
}

export interface TransferResult {
  transactionId: string;
  amount: number;
  sourceBalance: number;
}

export interface CustomerPersonalDataUpdate {
  name: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  nidNumber: string;
  presentAddress: string;
  permanentAddress: string;
}

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
}

export type WithdrawalMethod =
  | "Cash at branch"
  | "Bank transfer"
  | "Mobile banking";

export interface TransactionRequest {
  userId: string;
  accountNumber: string;
  amount: number;
  paymentType: string;
  referenceNumber?: string;
  depositMethod?: string;
  withdrawalMethod?: WithdrawalMethod;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  mobileNumber?: string;
}

export interface WithdrawalData extends TransactionRequest {
  paymentType: "withdrawal";
  withdrawalMethod: WithdrawalMethod;
  referenceNumber: string;
}

export async function createAccount(
  account: CreateAccountInput,
): Promise<{ accountNumber: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "staff") {
    throw new Error("Only staff can create bank accounts");
  }
  if (
    !account ||
    typeof account.userId !== "string" ||
    !account.userId.trim()
  ) {
    throw new Error("A customer is required");
  }

  const userIdClauses: Document[] = [
    { _id: account.userId },
    { id: account.userId },
  ];
  if (ObjectId.isValid(account.userId)) {
    userIdClauses.push({ _id: new ObjectId(account.userId) });
  }
  const customer = await bankingDb.collection("user").findOne(
    { $or: userIdClauses },
    { projection: { _id: 1, id: 1, name: 1, role: 1 } },
  );
  if (!customer || customer.role !== "customer") {
    throw new Error("The selected customer was not found");
  }
  const customerName =
    typeof customer.name === "string" ? customer.name.trim() : "";
  if (!customerName) {
    throw new Error("The selected customer does not have a name");
  }
  const customerId =
    customer._id instanceof ObjectId
      ? customer._id.toHexString()
      : typeof customer._id === "string"
        ? customer._id
        : typeof customer.id === "string"
          ? customer.id
          : account.userId;

  if (!isValidTransactionPin(account.transactionPin)) {
    throw new Error("The transaction PIN must be exactly 4 digits");
  }
  if (account.transactionPin !== account.transactionPinConfirmation) {
    throw new Error("The transaction PIN confirmation does not match");
  }

  const initialDepositCents = toCents(account.initialDeposit);
  if (initialDepositCents === null || initialDepositCents < 0) {
    throw new Error("The initial deposit must be a valid non-negative amount");
  }

  const accountCollection = bankingDb.collection("bank-account");
  let accountNumber = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = String(randomInt(1_000_000_000, 10_000_000_000));
    const existing = await accountCollection.findOne(
      { accountNumber: candidate },
      { projection: { _id: 1 } },
    );
    if (!existing) {
      accountNumber = candidate;
      break;
    }
  }
  if (!accountNumber) {
    throw new Error("A unique account number could not be generated");
  }

  const pinFields = await hashTransactionPin(account.transactionPin);
  const accountFields = {
    userId: customerId,
    name: customerName,
    fatherName: account.fatherName,
    motherName: account.motherName,
    dateOfBirth: account.dateOfBirth,
    gender: account.gender,
    nationality: account.nationality,
    maritalStatus: account.maritalStatus,
    occupation: account.occupation,
    nidNumber: account.nidNumber,
    presentAddress: account.presentAddress,
    permanentAddress: account.permanentAddress,
    accountType: account.accountType,
    branchId: account.branchId,
  };
  await accountCollection.insertOne({
    ...accountFields,
    accountNumber,
    initialDeposit: initialDepositCents / 100,
    balance: initialDepositCents / 100,
    status: "active",
    transactionPinConfigured: true,
    ...pinFields,
    createdAt: new Date().toISOString(),
  });

  return { accountNumber };
}

export async function registerCustomer(
  input: RegisterCustomerInput,
): Promise<{ customerId: string; email: string }> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session?.user.role !== "staff") {
    throw new Error("Only staff can register customers");
  }
  if (!input || typeof input !== "object") {
    throw new Error("Customer details are required");
  }

  const name = validateTextField(input.name, "Name", 100, true);
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = input.password;
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Enter a valid email address");
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new Error(
      "Password must be 8 to 128 characters and include an uppercase letter and a number",
    );
  }

  const result = await auth.api.createUser({
    body: { name, email, password },
    headers: requestHeaders,
  });
  revalidatePath("/dashboard/staff/all-users");
  return { customerId: result.user.id, email: result.user.email };
}

export async function crateAccount(
  account: CreateAccountInput,
): Promise<{ accountNumber: string }> {
  return createAccount(account);
}

export async function setTransactionPin(
  accountNumber: string,
  transactionPin: string,
  transactionPinConfirmation: string,
): Promise<{ message: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can set their transaction PIN");
  }
  if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
    throw new Error("Invalid account number");
  }
  if (!isValidTransactionPin(transactionPin)) {
    throw new Error("The transaction PIN must be exactly 4 digits");
  }
  if (transactionPin !== transactionPinConfirmation) {
    throw new Error("The transaction PIN confirmation does not match");
  }

  const accountCollection = bankingDb.collection("bank-account");
  const account = await accountCollection.findOne({
    accountNumber,
    userId: session.user.id,
  });
  if (!account) throw new Error("The account was not found");
  if (account.transactionPinHash || account.transactionPinConfigured === true) {
    throw new Error("A transaction PIN is already configured for this account");
  }

  const pinFields = await hashTransactionPin(transactionPin);
  const result = await accountCollection.updateOne(
    {
      _id: account._id,
      transactionPinHash: { $exists: false },
      transactionPinConfigured: { $ne: true },
    },
    {
      $set: {
        ...pinFields,
        transactionPinConfigured: true,
        transactionPinFailedAttempts: 0,
        transactionPinLockedUntil: null,
        transactionPinUpdatedAt: new Date().toISOString(),
      },
    },
  );
  if (result.matchedCount !== 1) {
    throw new Error("The transaction PIN changed before it could be saved");
  }

  return { message: "Transaction PIN configured successfully." };
}

export async function updateCustomerPersonalData(
  userId: string,
  input: CustomerPersonalDataUpdate,
): Promise<{ message: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    session?.user.role !== "staff" &&
    session?.user.role !== "admin"
  ) {
    throw new Error(
      "Only staff or admins can update customer personal information",
    );
  }
  if (typeof userId !== "string" || !userId.trim() || userId.length > 128) {
    throw new Error("Invalid customer ID");
  }
  if (!input || typeof input !== "object") {
    throw new Error("Customer information is required");
  }

  const updatedFields = {
    name: validateTextField(input.name, "Name", 100, true),
    fatherName: validateTextField(input.fatherName, "Father's name", 120),
    motherName: validateTextField(input.motherName, "Mother's name", 120),
    dateOfBirth: validateDateField(input.dateOfBirth),
    gender: validateGender(input.gender),
    nidNumber: validateTextField(input.nidNumber, "NID number", 32),
    presentAddress: validateTextField(
      input.presentAddress,
      "Present address",
      500,
    ),
    permanentAddress: validateTextField(
      input.permanentAddress,
      "Permanent address",
      500,
    ),
  };

  const userIdClauses: Document[] = [{ _id: userId }, { id: userId }];
  if (ObjectId.isValid(userId)) {
    userIdClauses.push({ _id: new ObjectId(userId) });
  }

  const dbSession = mongoClient.startSession();
  try {
    const outcome = await dbSession.withTransaction(async () => {
      const userUpdate = await bankingDb.collection("user").updateOne(
        { $or: userIdClauses },
        { $set: { name: updatedFields.name, updatedAt: new Date() } },
        { session: dbSession },
      );
      if (userUpdate.matchedCount !== 1) {
        throw new Error("The customer record was not found");
      }

      const accountUpdate = await bankingDb
        .collection("bank-account")
        .updateMany(
          { userId },
          {
            $set: {
              ...updatedFields,
              personalInformationUpdatedAt: new Date().toISOString(),
            },
          },
          { session: dbSession },
        );
      if (accountUpdate.matchedCount === 0) {
        throw new Error("No bank account was found for this customer");
      }

      return accountUpdate.matchedCount;
    });

    if (!outcome) throw new Error("The customer information was not updated");
    return {
      message: `Customer information updated for ${outcome} account${outcome === 1 ? "" : "s"}.`,
    };
  } finally {
    await dbSession.endSession();
  }
}

export async function setCustomerBlocked(
  userId: string,
  blocked: boolean,
): Promise<{ blocked: boolean; message: string }> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session?.user.role !== "admin") {
    throw new Error("Only admins can block or unblock customer accounts");
  }
  if (typeof userId !== "string" || !userId.trim() || userId.length > 128) {
    throw new Error("Invalid customer ID");
  }
  if (typeof blocked !== "boolean") {
    throw new Error("A valid customer account status is required");
  }

  const userIdClauses: Document[] = [{ _id: userId }, { id: userId }];
  if (ObjectId.isValid(userId)) {
    userIdClauses.push({ _id: new ObjectId(userId) });
  }
  const customer = await bankingDb.collection("user").findOne(
    { $or: userIdClauses },
    { projection: { _id: 1, id: 1, role: 1 } },
  );
  if (!customer || customer.role !== "customer") {
    throw new Error("The customer record was not found");
  }

  const customerId =
    customer._id instanceof ObjectId
      ? customer._id.toHexString()
      : typeof customer._id === "string"
        ? customer._id
        : typeof customer.id === "string"
          ? customer.id
          : "";
  if (!customerId) {
    throw new Error("The customer record has an invalid ID");
  }

  const result = blocked
    ? await auth.api.banUser({
        body: {
          userId: customerId,
          banReason: "Blocked by a bank administrator",
        },
        headers: requestHeaders,
      })
    : await auth.api.unbanUser({
        body: { userId: customerId },
        headers: requestHeaders,
      });
  if (!result.user) {
    throw new Error("The customer account status could not be updated");
  }

  revalidatePath("/dashboard/admin/all-customers");
  return {
    blocked,
    message: blocked
      ? "Customer account blocked successfully."
      : "Customer account unblocked successfully.",
  };
}

export async function setBankAccountFrozen(
  accountNumber: string,
  frozen: boolean,
): Promise<{ frozen: boolean; message: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "admin") {
    throw new Error("Only admins can freeze or unfreeze bank accounts");
  }
  if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
    throw new Error("Invalid bank account number");
  }
  if (typeof frozen !== "boolean") {
    throw new Error("A valid account status is required");
  }

  const accountCollection = bankingDb.collection("bank-account");
  const account = await accountCollection.findOne({ accountNumber });
  if (!account) throw new Error("Bank account not found");

  const currentStatus = String(
    account.status ?? account.accountStatus ??
      (account.isActive === false ? "inactive" : "active"),
  )
    .trim()
    .toLowerCase();
  if (frozen && currentStatus === "frozen") {
    return { frozen: true, message: "This account is already frozen." };
  }
  if (!frozen && currentStatus !== "frozen") {
    throw new Error("Only frozen accounts can be unfrozen");
  }
  if (frozen && (currentStatus !== "active" || account.isActive === false)) {
    throw new Error("Only active accounts can be frozen");
  }

  const changedAt = new Date().toISOString();
  const freezeFilter: Document = { _id: account._id };
  if (account.status === undefined) {
    freezeFilter.status = { $exists: false };
  } else {
    freezeFilter.status = account.status;
  }
  const result = frozen
    ? await accountCollection.updateOne(
        freezeFilter,
        {
          $set: {
            status: "frozen",
            frozenAt: changedAt,
            frozenBy: session.user.id,
          },
        },
      )
    : await accountCollection.updateOne(
        { _id: account._id, status: "frozen" },
        {
          $set: {
            status: "active",
            unfrozenAt: changedAt,
            unfrozenBy: session.user.id,
          },
          $unset: { frozenAt: "", frozenBy: "" },
        },
      );
  if (result.matchedCount !== 1) {
    throw new Error("The account status changed before the update completed");
  }

  revalidatePath("/dashboard/admin/all-accounts");
  return {
    frozen,
    message: frozen
      ? "Bank account frozen successfully."
      : "Bank account unfrozen successfully.",
  };
}

const MAX_TRANSFER_CENTS = 2_000_000;
const DAILY_TRANSFER_LIMIT_CENTS = 2_000_000;
const MAX_TRANSFER_DESCRIPTION_LENGTH = 120;
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export async function transferFunds(
  input: TransferInput,
): Promise<TransferResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can transfer money");
  }
  if (!input || typeof input !== "object") {
    throw new Error("Transfer details are required");
  }

  const sourceAccountNumber =
    typeof input.sourceAccountNumber === "string"
      ? input.sourceAccountNumber.trim()
      : "";
  const recipientAccountNumber =
    typeof input.recipientAccountNumber === "string"
      ? input.recipientAccountNumber.trim()
      : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const amountInCents = toCents(input.amount);

  if (!/^\d{10}$/.test(sourceAccountNumber)) {
    throw new Error("Select a valid source account");
  }
  if (!/^\d{10}$/.test(recipientAccountNumber)) {
    throw new Error("Enter a valid recipient account number");
  }
  if (sourceAccountNumber === recipientAccountNumber) {
    throw new Error("Choose a different recipient account");
  }
  if (amountInCents === null || amountInCents < 100) {
    throw new Error("Transfer amount must be at least ৳1");
  }
  if (amountInCents > MAX_TRANSFER_CENTS) {
    throw new Error("The maximum amount per transfer is ৳20,000");
  }
  if (
    !description ||
    description.length > MAX_TRANSFER_DESCRIPTION_LENGTH
  ) {
    throw new Error("Enter a description of up to 120 characters");
  }
  if (!isValidTransactionPin(input.transactionPin)) {
    throw new Error("Enter your 4-digit transaction PIN");
  }

  const accountCollection = bankingDb.collection("bank-account");
  const transactionCollection = bankingDb.collection("deposit");
  const dbSession = mongoClient.startSession();
  const transactionId = randomUUID();

  try {
    const outcome = await dbSession.withTransaction(async () => {
      const sourceAccount = await accountCollection.findOne(
        { accountNumber: sourceAccountNumber, userId: session.user.id },
        { session: dbSession },
      );
      if (!sourceAccount) {
        throw new Error("The selected source account was not found");
      }
      assertAccountIsActive(sourceAccount, "Your source account");
      if (
        sourceAccount.transactionPinConfigured !== true ||
        typeof sourceAccount.transactionPinHash !== "string" ||
        typeof sourceAccount.transactionPinSalt !== "string"
      ) {
        throw new Error("Set a transaction PIN in My Account before transferring");
      }

      const lockUntil = parseDate(sourceAccount.transactionPinLockedUntil);
      const now = new Date();
      if (lockUntil && lockUntil.getTime() > now.getTime()) {
        throw new Error("Your transaction PIN is locked. Try again later.");
      }

      const pinMatches = await verifyTransactionPin(
        input.transactionPin,
        sourceAccount.transactionPinSalt,
        sourceAccount.transactionPinHash,
      );
      if (!pinMatches) {
        const previousAttempts =
          typeof sourceAccount.transactionPinFailedAttempts === "number" &&
          Number.isSafeInteger(sourceAccount.transactionPinFailedAttempts)
            ? sourceAccount.transactionPinFailedAttempts
            : 0;
        const failedAttempts = previousAttempts + 1;
        const nextLock =
          failedAttempts >= MAX_PIN_ATTEMPTS
            ? new Date(now.getTime() + PIN_LOCK_DURATION_MS)
            : null;
        const attemptUpdate = await accountCollection.updateOne(
          { _id: sourceAccount._id },
          {
            $set: {
              transactionPinFailedAttempts: failedAttempts,
              transactionPinLockedUntil: nextLock,
            },
          },
          { session: dbSession },
        );
        if (attemptUpdate.matchedCount !== 1) {
          throw new Error("The PIN attempt could not be recorded");
        }
        return {
          ok: false as const,
          message:
            failedAttempts >= MAX_PIN_ATTEMPTS
              ? "Incorrect PIN. Transfers are locked for 15 minutes."
              : "Incorrect transaction PIN",
        };
      }

      const recipientMatches = await accountCollection
        .find({ accountNumber: recipientAccountNumber }, { session: dbSession })
        .limit(2)
        .toArray();
      if (recipientMatches.length === 0) {
        throw new Error("The recipient account was not found");
      }
      if (recipientMatches.length > 1) {
        throw new Error("The recipient account number is not unique");
      }
      const recipientAccount = recipientMatches[0];
      if (!recipientAccount) {
        throw new Error("The recipient account was not found");
      }
      assertAccountIsActive(recipientAccount, "The recipient account");
      if (
        recipientAccount._id.equals(sourceAccount._id) ||
        recipientAccount.accountNumber === sourceAccountNumber
      ) {
        throw new Error("Choose a different recipient account");
      }
      if (
        typeof recipientAccount.userId !== "string" ||
        !recipientAccount.userId
      ) {
        throw new Error("The recipient account has no account holder");
      }

      const sourceBalance = await getAccountBalanceInCents(
        sourceAccount,
        sourceAccountNumber,
        transactionCollection,
        dbSession,
      );
      if (sourceBalance < amountInCents) {
        throw new Error("Insufficient balance for this transfer");
      }

      const dayBounds = bangladeshDayBounds(now);
      const sentToday = await transactionCollection
        .find(
          {
            accountNumber: sourceAccountNumber,
            userId: session.user.id,
            paymentType: "transfer",
            transferDirection: "sent",
            statuses: "success",
            createdAt: { $gte: dayBounds.start, $lt: dayBounds.end },
          },
          { session: dbSession },
        )
        .project({ amount: 1 })
        .toArray();
      const totalSentToday = sentToday.reduce(
        (total, transaction) => total + (toCents(transaction.amount) ?? 0),
        0,
      );
      if (totalSentToday + amountInCents > DAILY_TRANSFER_LIMIT_CENTS) {
        throw new Error("This transfer would exceed the ৳20,000 daily limit");
      }

      const recipientBalance = await getAccountBalanceInCents(
        recipientAccount,
        recipientAccountNumber,
        transactionCollection,
        dbSession,
      );
      const sourceBalanceAfter = sourceBalance - amountInCents;
      const recipientBalanceAfter = recipientBalance + amountInCents;
      const completedAt = now.toISOString();

      const sourceUpdate = await accountCollection.updateOne(
        { _id: sourceAccount._id },
        {
          $set: {
            balance: sourceBalanceAfter / 100,
            balanceUpdatedAt: completedAt,
            transactionPinFailedAttempts: 0,
            transactionPinLockedUntil: null,
          },
        },
        { session: dbSession },
      );
      if (sourceUpdate.matchedCount !== 1) {
        throw new Error("The source account balance could not be updated");
      }

      const recipientUpdate = await accountCollection.updateOne(
        { _id: recipientAccount._id },
        {
          $set: {
            balance: recipientBalanceAfter / 100,
            balanceUpdatedAt: completedAt,
          },
        },
        { session: dbSession },
      );
      if (recipientUpdate.matchedCount !== 1) {
        throw new Error("The recipient account balance could not be updated");
      }

      await transactionCollection.insertMany(
        [
          {
            transactionId,
            referenceNumber: transactionId,
            userId: session.user.id,
            accountNumber: sourceAccountNumber,
            recipientAccountNumber,
            paymentType: "transfer",
            transferDirection: "sent",
            amount: amountInCents / 100,
            description,
            statuses: "success",
            createdAt: completedAt,
            completedAt,
          },
          {
            transactionId,
            referenceNumber: transactionId,
            userId: recipientAccount.userId,
            accountNumber: recipientAccountNumber,
            senderAccountNumber: sourceAccountNumber,
            paymentType: "transfer",
            transferDirection: "received",
            amount: amountInCents / 100,
            description,
            statuses: "success",
            createdAt: completedAt,
            completedAt,
          },
        ],
        { session: dbSession },
      );

      return {
        ok: true as const,
        transactionId,
        amount: amountInCents / 100,
        sourceBalance: sourceBalanceAfter / 100,
      };
    });

    if (!outcome) throw new Error("The transfer did not complete");
    if (!outcome.ok) throw new Error(outcome.message);
    return {
      transactionId: outcome.transactionId,
      amount: outcome.amount,
      sourceBalance: outcome.sourceBalance,
    };
  } finally {
    await dbSession.endSession();
  }
}

export async function addTransaction(data: TransactionRequest): Promise<unknown> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can submit transaction requests");
  }
  if (!data || typeof data !== "object") {
    throw new Error("Transaction details are required");
  }

  const accountNumber =
    typeof data.accountNumber === "string" ? data.accountNumber.trim() : "";
  const paymentType = String(data.paymentType ?? "").toLowerCase();
  const amountInCents = toCents(data.amount);
  if (data.userId !== session.user.id) {
    throw new Error("You can only submit requests for your own accounts");
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error("Select a valid bank account");
  }
  if (paymentType !== "deposit" && paymentType !== "withdrawal") {
    throw new Error("Only deposit and withdrawal requests can be submitted");
  }
  if (amountInCents === null || amountInCents <= 0) {
    throw new Error("Transaction amount must be greater than zero");
  }

  const account = await bankingDb.collection("bank-account").findOne({
    accountNumber,
    userId: session.user.id,
  });
  if (!account) throw new Error("The selected bank account was not found");
  assertAccountIsActive(account, "Your account");

  const response = await fetch("https://bank-server-coral.vercel.app/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      userId: session.user.id,
      accountNumber,
      paymentType,
    }),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Transaction request failed (${response.status}): ${errorMessage || response.statusText}`,
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    Array.isArray(result) ||
    !("acknowledged" in result) ||
    result.acknowledged !== true ||
    !("insertedId" in result)
  ) {
    throw new Error("The transaction API did not confirm the request was saved");
  }

  return result;
}

export async function approveTransaction(
  transactionId: string,
): Promise<{ status: "success" | "rejected"; message: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "staff") {
    throw new Error("Only staff can approve transaction requests");
  }
  if (!ObjectId.isValid(transactionId)) {
    throw new Error("Invalid transaction ID");
  }

  const objectId = new ObjectId(transactionId);
  const transactionCollection = bankingDb.collection("deposit");
  const accountCollection = bankingDb.collection("bank-account");
  const dbSession = mongoClient.startSession();

  try {
    const outcome = await dbSession.withTransaction(async () => {
      const transaction = await transactionCollection.findOne(
        { _id: objectId, statuses: "pending" },
        { session: dbSession },
      );
      if (!transaction) {
        const existing = await transactionCollection.findOne(
          { _id: objectId },
          { projection: { statuses: 1 }, session: dbSession },
        );
        if (!existing) throw new Error("Transaction request was not found");
        throw new Error(
          `This transaction cannot be approved from status "${String(existing.statuses ?? "unknown")}"`,
        );
      }

      const paymentType = String(transaction.paymentType ?? "").toLowerCase();
      if (paymentType !== "deposit" && paymentType !== "withdrawal") {
        throw new Error("Only deposit and withdrawal requests can be approved");
      }

      const amountInCents = toCents(transaction.amount);
      if (amountInCents === null || amountInCents <= 0) {
        throw new Error("Transaction amount must be greater than zero");
      }

      const accountNumber =
        typeof transaction.accountNumber === "string"
          ? transaction.accountNumber
          : "";
      const userId =
        typeof transaction.userId === "string" ? transaction.userId : "";
      if (!accountNumber || !userId) {
        throw new Error("Transaction is missing its account information");
      }

      const account = await accountCollection.findOne(
        { accountNumber, userId },
        { session: dbSession },
      );
      if (!account) throw new Error("The linked account was not found");
      assertAccountIsActive(account, "The linked account");

      const currentBalance = await getAccountBalanceInCents(
        account,
        accountNumber,
        transactionCollection,
        dbSession,
      );
      if (paymentType === "withdrawal" && amountInCents > currentBalance) {
        const rejectedAt = new Date();
        const result = await transactionCollection.updateOne(
          { _id: objectId, statuses: "pending" },
          {
            $set: {
              statuses: "rejected",
              rejectionReason: "Insufficient funds",
              rejectedAt,
            },
          },
          { session: dbSession },
        );
        if (result.matchedCount !== 1) {
          throw new Error("Transaction status changed before it could be rejected");
        }
        return {
          status: "rejected" as const,
          message: "Insufficient funds. The request was marked rejected.",
        };
      }

      const nextBalance =
        paymentType === "deposit"
          ? currentBalance + amountInCents
          : currentBalance - amountInCents;
      const completedAt = new Date();
      const accountUpdate = await accountCollection.updateOne(
        { _id: account._id },
        { $set: { balance: nextBalance / 100, balanceUpdatedAt: completedAt } },
        { session: dbSession },
      );
      if (accountUpdate.matchedCount !== 1) {
        throw new Error("Account balance could not be updated");
      }

      const transactionUpdate = await transactionCollection.updateOne(
        { _id: objectId, statuses: "pending" },
        { $set: { statuses: "success", completedAt } },
        { session: dbSession },
      );
      if (transactionUpdate.matchedCount !== 1) {
        throw new Error("Transaction status changed before it could be completed");
      }

      return {
        status: "success" as const,
        message:
          paymentType === "deposit"
            ? "Deposit approved and added to the account balance."
            : "Withdrawal approved and removed from the account balance.",
      };
    });

    if (!outcome) throw new Error("Transaction approval did not complete");
    return outcome;
  } finally {
    await dbSession.endSession();
  }
}

export async function approveLoanApplication(
  adminRecordId: string,
  accountNumber: string,
): Promise<{ amount: number; accountNumber: string; message: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "admin") {
    throw new Error("Only admins can approve loan applications");
  }
  if (!ObjectId.isValid(adminRecordId)) {
    throw new Error("Invalid admin loan record ID");
  }
  if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
    throw new Error("Select a valid account for the loan disbursement");
  }

  const adminRecordObjectId = new ObjectId(adminRecordId);
  const adminLoanCollection = bankingDb.collection("loan-application-admin");
  const loanCollection = bankingDb.collection("loan-application");
  const accountCollection = bankingDb.collection("bank-account");
  const transactionCollection = bankingDb.collection("deposit");
  const dbSession = mongoClient.startSession();
  const transactionId = randomUUID();

  try {
    const outcome = await dbSession.withTransaction(async () => {
      const adminRecord = await adminLoanCollection.findOne(
        { _id: adminRecordObjectId },
        { session: dbSession },
      );
      if (!adminRecord) throw new Error("Admin loan record was not found");

      const loanApplicationId =
        typeof adminRecord.loanApplicationId === "string"
          ? adminRecord.loanApplicationId
          : "";
      if (!ObjectId.isValid(loanApplicationId)) {
        throw new Error("The admin record has an invalid loan application ID");
      }

      const loanApplicationObjectId = new ObjectId(loanApplicationId);
      const loanApplication = await loanCollection.findOne(
        { _id: loanApplicationObjectId },
        { session: dbSession },
      );
      if (!loanApplication) throw new Error("Loan application was not found");
      const applicationStatus = String(
        loanApplication.applicationStatus ?? "",
      ).toLowerCase();
      const adminRecordStatus = String(
        adminRecord.applicationStatus ?? "",
      ).toLowerCase();
      if (
        !["sent_for_admin", "pending"].includes(applicationStatus) ||
        !["sent_for_admin", "pending"].includes(adminRecordStatus)
      ) {
        throw new Error(
          `This loan application is not waiting for admin acceptance`,
        );
      }

      const userId =
        typeof loanApplication.userId === "string"
          ? loanApplication.userId
          : "";
      if (!userId) {
        throw new Error("Loan application is missing its customer ID");
      }
      const amountInCents = toCents(loanApplication.requestedAmount);
      if (amountInCents === null || amountInCents <= 0) {
        throw new Error("Loan amount must be greater than zero");
      }

      const account = await accountCollection.findOne(
        { accountNumber, userId },
        { session: dbSession },
      );
      if (!account) {
        throw new Error("The selected account does not belong to this customer");
      }
      assertAccountIsActive(account, "The selected account");

      const currentBalance = await getAccountBalanceInCents(
        account,
        accountNumber,
        transactionCollection,
        dbSession,
      );
      const nextBalance = currentBalance + amountInCents;
      if (!Number.isSafeInteger(nextBalance)) {
        throw new Error("The resulting account balance is too large");
      }

      const completedAt = new Date();
      const completedAtIso = completedAt.toISOString();
      const accountUpdate = await accountCollection.updateOne(
        { _id: account._id },
        {
          $set: {
            balance: nextBalance / 100,
            balanceUpdatedAt: completedAt,
          },
        },
        { session: dbSession },
      );
      if (accountUpdate.matchedCount !== 1) {
        throw new Error("Account balance could not be updated");
      }

      const loanUpdate = await loanCollection.updateOne(
        {
          _id: loanApplicationObjectId,
          applicationStatus: { $in: ["pending", "sent_for_admin"] },
        },
        {
          $set: {
            applicationStatus: "success",
            approvedAt: completedAtIso,
            disbursedAmount: amountInCents / 100,
            creditedAccountNumber: accountNumber,
            repaidAmount: 0,
            outstandingAmount: amountInCents / 100,
            repaymentStatus: "unpaid",
          },
        },
        { session: dbSession },
      );
      if (loanUpdate.matchedCount !== 1) {
        throw new Error("Loan status changed before it could be approved");
      }

      const adminUpdate = await adminLoanCollection.updateMany(
        { loanApplicationId },
        {
          $set: {
            applicationStatus: "success",
            approvedAt: completedAtIso,
            disbursedAmount: amountInCents / 100,
            creditedAccountNumber: accountNumber,
            repaidAmount: 0,
            outstandingAmount: amountInCents / 100,
            repaymentStatus: "unpaid",
          },
        },
        { session: dbSession },
      );
      if (adminUpdate.matchedCount === 0) {
        throw new Error("Admin loan record could not be updated");
      }

      const transactionInsert = await transactionCollection.insertOne(
        {
          transactionId,
          userId,
          accountNumber,
          paymentType: "deposit",
          depositMethod: "Loan disbursement",
          description: `${String(loanApplication.loanType ?? "Loan")} disbursement`,
          referenceNumber: loanApplicationId,
          loanApplicationId,
          amount: amountInCents / 100,
          statuses: "success",
          createdAt: completedAtIso,
          completedAt: completedAtIso,
        },
        { session: dbSession },
      );
      if (!transactionInsert.acknowledged) {
        throw new Error("Loan disbursement transaction could not be recorded");
      }

      return {
        amount: amountInCents / 100,
        accountNumber,
      };
    });

    if (!outcome) throw new Error("Loan approval did not complete");
    revalidatePath("/dashboard/admin/admin-loan-applications");
    revalidatePath("/dashboard/staff/lon-application");
    revalidatePath("/dashboard/coustomer/lone");
    return {
      ...outcome,
      message: `Loan accepted and ${new Intl.NumberFormat("en-BD").format(outcome.amount)} BDT credited to account ${outcome.accountNumber}.`,
    };
  } finally {
    await dbSession.endSession();
  }
}

function toCents(value: unknown): number | null {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function validateTextField(
  value: unknown,
  label: string,
  maxLength: number,
  required = false,
): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be text`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${label} is required`);
  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}

function validateDateField(value: unknown): string {
  const date = validateTextField(value, "Date of birth", 10);
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Date of birth must be a valid date");
  }
  return date;
}

function validateGender(value: unknown): string {
  const gender = validateTextField(value, "Gender", 20).toUpperCase();
  if (gender && !["MALE", "FEMALE", "OTHER"].includes(gender)) {
    throw new Error("Gender must be Male, Female, or Other");
  }
  return gender;
}

function isValidTransactionPin(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}$/.test(value);
}

function deriveTransactionPinHash(pin: string, salt: string): Promise<Buffer> {
  const pepper = process.env.BETTER_AUTH_SECRET;
  if (!pepper) throw new Error("Transaction PIN hashing is not configured");

  return new Promise((resolve, reject) => {
    scrypt(`${pin}:${pepper}`, Buffer.from(salt, "hex"), 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

async function hashTransactionPin(
  pin: string,
): Promise<{ transactionPinSalt: string; transactionPinHash: string }> {
  const transactionPinSalt = randomBytes(16).toString("hex");
  const transactionPinHash = (
    await deriveTransactionPinHash(pin, transactionPinSalt)
  ).toString("hex");
  return { transactionPinSalt, transactionPinHash };
}

async function verifyTransactionPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  if (!/^[\da-f]{32}$/i.test(salt) || !/^[\da-f]{128}$/i.test(expectedHash)) {
    return false;
  }
  const expected = Buffer.from(expectedHash, "hex");
  const actual = await deriveTransactionPinHash(pin, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function assertAccountIsActive(account: Document, label: string): void {
  const status = account.status ?? account.accountStatus;
  if (
    typeof status === "string" &&
    status.trim().toLowerCase() === "frozen"
  ) {
    throw new Error(
      `${label} is frozen and cannot make or receive transactions`,
    );
  }
  if (
    (status !== undefined &&
      status !== null &&
      String(status).trim().toLowerCase() !== "active") ||
    account.isActive === false
  ) {
    throw new Error(`${label} is not active`);
  }
}

function parseDate(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function bangladeshDayBounds(now: Date): { start: string; end: string } {
  const offsetMs = 6 * 60 * 60 * 1000;
  const bangladeshDate = new Date(now.getTime() + offsetMs);
  const startMs =
    Date.UTC(
      bangladeshDate.getUTCFullYear(),
      bangladeshDate.getUTCMonth(),
      bangladeshDate.getUTCDate(),
    ) - offsetMs;
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function getAccountBalanceInCents(
  account: Document,
  accountNumber: string,
  transactionCollection: Collection<Document>,
  dbSession: ClientSession,
): Promise<number> {
  const storedBalance = toCents(account.balance);
  if (storedBalance !== null && storedBalance >= 0) return storedBalance;

  const openingBalance = toCents(account.initialDeposit) ?? 0;
  const transactions = await transactionCollection
    .find({ accountNumber }, { session: dbSession })
    .project({
      paymentType: 1,
      statuses: 1,
      status: 1,
      amount: 1,
      transferDirection: 1,
    })
    .toArray();

  return transactions.reduce((balance, transaction) => {
    const status = String(transaction.statuses ?? transaction.status ?? "")
      .toLowerCase();
    if (
      !status.includes("complete") &&
      !status.includes("approved") &&
      !status.includes("success")
    ) {
      return balance;
    }

    const transactionAmount = toCents(transaction.amount) ?? 0;
    const paymentType = String(transaction.paymentType ?? "").toLowerCase();
    if (paymentType === "deposit") return balance + transactionAmount;
    if (paymentType === "withdrawal") return balance - transactionAmount;
    if (paymentType === "loan-repayment") return balance - transactionAmount;
    if (paymentType === "transfer") {
      return transaction.transferDirection === "received"
        ? balance + transactionAmount
        : transaction.transferDirection === "sent"
          ? balance - transactionAmount
          : balance;
    }
    return balance;
  }, openingBalance);
}
export interface LoanApplicationInput {
  loanType: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  employmentStatus: string;
  monthlyIncome: number;
  employerName: string;
}

export interface CustomerLoanCenterData {
  loans: {
    id: string;
    loanType: string;
    requestedAmount: number;
    disbursedAmount: number;
    termMonths: number;
    purpose: string;
    applicationStatus: string;
    submittedAt: string;
    creditedAccountNumber: string;
    repaidAmount: number;
    outstandingAmount: number;
  }[];
  accounts: {
    accountNumber: string;
    accountType: string;
    balance: number;
  }[];
}

export async function getCustomerLoanCenterData(): Promise<CustomerLoanCenterData> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can view their loan center");
  }

  const [loanRecords, accountRecords] = await Promise.all([
    bankingDb
      .collection("loan-application")
      .find({ userId: session.user.id })
      .sort({ submittedAt: -1, _id: -1 })
      .toArray(),
    bankingDb
      .collection("bank-account")
      .find({ userId: session.user.id })
      .project({
        accountNumber: 1,
        accountType: 1,
        balance: 1,
        initialDeposit: 1,
        status: 1,
        accountStatus: 1,
        isActive: 1,
      })
      .toArray(),
  ]);

  const loans = loanRecords.flatMap((record) => {
    const id =
      record._id instanceof ObjectId
        ? record._id.toHexString()
        : typeof record._id === "string"
          ? record._id
          : "";
    if (!id) return [];

    const disbursedCents = Math.max(toCents(record.disbursedAmount) ?? 0, 0);
    const repaidCents = Math.min(
      disbursedCents,
      Math.max(toCents(record.repaidAmount) ?? 0, 0),
    );
    const submittedAt =
      record.submittedAt instanceof Date
        ? record.submittedAt.toISOString()
        : typeof record.submittedAt === "string"
          ? record.submittedAt
          : "";

    return [
      {
        id,
        loanType: typeof record.loanType === "string" ? record.loanType : "Loan",
        requestedAmount: (toCents(record.requestedAmount) ?? 0) / 100,
        disbursedAmount: disbursedCents / 100,
        termMonths:
          typeof record.termMonths === "number" ? record.termMonths : 0,
        purpose: typeof record.purpose === "string" ? record.purpose : "",
        applicationStatus:
          typeof record.applicationStatus === "string"
            ? record.applicationStatus
            : "pending",
        submittedAt,
        creditedAccountNumber:
          typeof record.creditedAccountNumber === "string"
            ? record.creditedAccountNumber
            : "",
        repaidAmount: repaidCents / 100,
        outstandingAmount: (disbursedCents - repaidCents) / 100,
      },
    ];
  });

  const accounts = accountRecords.flatMap((record) => {
    const accountNumber =
      typeof record.accountNumber === "string" ? record.accountNumber : "";
    const accountStatus = String(
      record.status ?? record.accountStatus ?? "active",
    )
      .trim()
      .toLowerCase();
    if (
      !/^\d{10}$/.test(accountNumber) ||
      accountStatus !== "active" ||
      record.isActive === false
    ) {
      return [];
    }

    const balanceCents =
      toCents(record.balance) ?? toCents(record.initialDeposit) ?? 0;
    return [
      {
        accountNumber,
        accountType:
          typeof record.accountType === "string" ? record.accountType : "Bank",
        balance: Math.max(balanceCents, 0) / 100,
      },
    ];
  });

  return { loans, accounts };
}

export async function getCustomerAccountStatement(
  accountNumber: string,
): Promise<{
  accountNumber: string;
  accountType: string;
  generatedAt: string;
  transactions: {
    date: string;
    direction: string;
    type: string;
    description: string;
    amount: number | null;
    status: string;
    reference: string;
  }[];
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can download account statements");
  }
  if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
    throw new Error("Choose a valid bank account");
  }

  const account = await bankingDb.collection("bank-account").findOne(
    { userId: session.user.id, accountNumber },
    { projection: { accountNumber: 1, accountType: 1 } },
  );
  if (!account) {
    throw new Error("The selected account does not belong to your profile");
  }

  const records = await bankingDb
    .collection("deposit")
    .find({ userId: session.user.id, accountNumber })
    .project({
      paymentType: 1,
      transferDirection: 1,
      amount: 1,
      description: 1,
      depositMethod: 1,
      withdrawalMethod: 1,
      statuses: 1,
      status: 1,
      referenceNumber: 1,
      transactionId: 1,
      createdAt: 1,
      date: 1,
    })
    .toArray();
  const rows = records
    .map((record) => {
      const rawDate = record.createdAt ?? record.date;
      const date =
        rawDate instanceof Date
          ? rawDate
          : typeof rawDate === "string" || typeof rawDate === "number"
            ? new Date(rawDate)
            : null;
      const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
      const paymentType =
        typeof record.paymentType === "string"
          ? record.paymentType.toLowerCase()
          : "";
      const transferDirection =
        typeof record.transferDirection === "string"
          ? record.transferDirection.toLowerCase()
          : "";
      const direction =
        paymentType === "transfer"
          ? transferDirection === "received"
            ? "Credit"
            : transferDirection === "sent"
              ? "Debit"
              : "Activity"
          : paymentType === "deposit"
            ? "Credit"
            : paymentType.includes("withdraw") ||
                paymentType === "loan-repayment"
              ? "Debit"
              : "Activity";
      const type =
        paymentType === "transfer"
          ? `Transfer ${transferDirection || "activity"}`
          : paymentType === "loan-repayment"
            ? "Loan repayment"
            : paymentType.replace(/-/g, " ") || "Transaction";
      const description =
        typeof record.description === "string"
          ? record.description
          : typeof record.depositMethod === "string"
            ? record.depositMethod
            : typeof record.withdrawalMethod === "string"
              ? record.withdrawalMethod
              : "";
      const amountInCents = toCents(record.amount);
      const status =
        typeof record.statuses === "string"
          ? record.statuses
          : typeof record.status === "string"
            ? record.status
            : "Unknown";
      const reference =
        typeof record.referenceNumber === "string"
          ? record.referenceNumber
          : typeof record.transactionId === "string"
            ? record.transactionId
            : record._id instanceof ObjectId
              ? record._id.toHexString()
              : "";

      return {
        timestamp: validDate?.getTime() ?? 0,
        transaction: {
          date: validDate?.toISOString() ?? "",
          direction,
          type,
          description,
          amount:
            amountInCents === null ? null : Math.abs(amountInCents) / 100,
          status,
          reference,
        },
      };
    })
    .sort((left, right) => left.timestamp - right.timestamp);
  const accountType =
    typeof account.accountType === "string" ? account.accountType : "Bank";

  return {
    accountNumber,
    accountType,
    generatedAt: new Date().toISOString(),
    transactions: rows.map((row) => row.transaction),
  };
}

export async function repayLoan(
  loanId: string,
  accountNumber: string,
  amount: number | string,
): Promise<{
  transactionId: string;
  amount: number;
  repaidAmount: number;
  outstandingAmount: number;
  message: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can repay loans");
  }
  if (!ObjectId.isValid(loanId)) {
    throw new Error("Invalid loan application ID");
  }
  if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
    throw new Error("Select a valid bank account for repayment");
  }

  const amountInCents = toCents(amount);
  if (amountInCents === null || amountInCents <= 0) {
    throw new Error("Enter a repayment amount greater than zero");
  }

  const loanObjectId = new ObjectId(loanId);
  const loanCollection = bankingDb.collection("loan-application");
  const accountCollection = bankingDb.collection("bank-account");
  const transactionCollection = bankingDb.collection("deposit");
  const dbSession = mongoClient.startSession();
  const transactionId = randomUUID();

  try {
    const outcome = await dbSession.withTransaction(async () => {
      const loan = await loanCollection.findOne(
        { _id: loanObjectId, userId: session.user.id },
        { session: dbSession },
      );
      if (!loan) throw new Error("Loan application was not found");
      if (
        String(loan.applicationStatus ?? "").toLowerCase() !== "success"
      ) {
        throw new Error("Only approved and disbursed loans can be repaid");
      }

      const disbursedCents = toCents(loan.disbursedAmount);
      if (disbursedCents === null || disbursedCents <= 0) {
        throw new Error("The loan has no recorded disbursement to repay");
      }
      const previousRepaidCents =
        loan.repaidAmount === undefined ? 0 : toCents(loan.repaidAmount);
      if (
        previousRepaidCents === null ||
        previousRepaidCents < 0 ||
        previousRepaidCents > disbursedCents
      ) {
        throw new Error("The loan has an invalid repayment balance");
      }
      const outstandingCents = disbursedCents - previousRepaidCents;
      if (outstandingCents <= 0) {
        throw new Error("This loan has already been fully repaid");
      }
      if (amountInCents > outstandingCents) {
        throw new Error("Repayment cannot exceed the outstanding loan amount");
      }

      const account = await accountCollection.findOne(
        { accountNumber, userId: session.user.id },
        { session: dbSession },
      );
      if (!account) throw new Error("The selected bank account was not found");
      assertAccountIsActive(account, "The selected account");

      const currentBalance = await getAccountBalanceInCents(
        account,
        accountNumber,
        transactionCollection,
        dbSession,
      );
      if (currentBalance < amountInCents) {
        throw new Error("Insufficient balance for this loan repayment");
      }

      const nextBalance = currentBalance - amountInCents;
      const nextRepaidCents = previousRepaidCents + amountInCents;
      const nextOutstandingCents = outstandingCents - amountInCents;
      const paidAt = new Date();
      const paidAtIso = paidAt.toISOString();

      const accountUpdate = await accountCollection.updateOne(
        { _id: account._id },
        { $set: { balance: nextBalance / 100, balanceUpdatedAt: paidAt } },
        { session: dbSession },
      );
      if (accountUpdate.matchedCount !== 1) {
        throw new Error("Bank account balance could not be updated");
      }

      const loanUpdateFilter: Document = {
        _id: loanObjectId,
        userId: session.user.id,
        applicationStatus: loan.applicationStatus,
      };
      if (loan.repaidAmount === undefined) {
        loanUpdateFilter.repaidAmount = { $exists: false };
      } else {
        loanUpdateFilter.repaidAmount = loan.repaidAmount;
      }
      const loanUpdate = await loanCollection.updateOne(
        loanUpdateFilter,
        {
          $set: {
            repaidAmount: nextRepaidCents / 100,
            outstandingAmount: nextOutstandingCents / 100,
            repaymentStatus: nextOutstandingCents === 0 ? "paid" : "partial",
            lastRepaymentAt: paidAtIso,
          },
        },
        { session: dbSession },
      );
      if (loanUpdate.matchedCount !== 1) {
        throw new Error("Loan balance changed before repayment could complete");
      }

      const transactionInsert = await transactionCollection.insertOne(
        {
          transactionId,
          userId: session.user.id,
          accountNumber,
          paymentType: "loan-repayment",
          withdrawalMethod: "Loan repayment",
          description: `${String(loan.loanType ?? "Loan")} repayment`,
          referenceNumber: transactionId,
          loanApplicationId: loanId,
          amount: amountInCents / 100,
          statuses: "success",
          createdAt: paidAtIso,
          completedAt: paidAtIso,
        },
        { session: dbSession },
      );
      if (!transactionInsert.acknowledged) {
        throw new Error("Loan repayment transaction could not be recorded");
      }

      return {
        amount: amountInCents / 100,
        repaidAmount: nextRepaidCents / 100,
        outstandingAmount: nextOutstandingCents / 100,
      };
    });

    if (!outcome) throw new Error("Loan repayment did not complete");
    revalidatePath("/dashboard/coustomer/lone");
    revalidatePath("/dashboard/coustomer/my-tranactions");
    revalidatePath("/dashboard/coustomer/my-account");
    revalidatePath("/dashboard/coustomer");
    return {
      ...outcome,
      transactionId,
      message: outcome.outstandingAmount === 0
        ? "Loan fully repaid."
        : "Loan repayment completed.",
    };
  } finally {
    await dbSession.endSession();
  }
}

export async function loneRequest(
  data: LoanApplicationInput,
): Promise<{ insertedId: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "customer") {
    throw new Error("Only customers can submit loan applications");
  }
  if (
    !data ||
    !["Personal loan", "Business loan", "Education loan", "Home loan"].includes(
      data.loanType,
    ) ||
    !Number.isSafeInteger(data.requestedAmount) ||
    data.requestedAmount <= 0 ||
    ![6, 12, 18, 24, 36, 48, 60].includes(data.termMonths) ||
    typeof data.purpose !== "string" ||
    !data.purpose.trim() ||
    !["Salaried", "Self-employed", "Business owner", "Student", "Other"].includes(
      data.employmentStatus,
    ) ||
    !Number.isFinite(data.monthlyIncome) ||
    data.monthlyIncome < 0 ||
    typeof data.employerName !== "string"
  ) {
    throw new Error("Enter valid loan application details");
  }

  const response = await fetch(
    "https://bank-server-coral.vercel.app/api/loan-application-staff",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        userId: session.user.id,
        applicantName: session.user.name ?? "",
        applicantEmail: session.user.email ?? "",
        purpose: data.purpose.trim(),
        employerName: data.employerName.trim(),
        applicationStatus: "pending",
        submittedAt: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Could not submit loan application (${response.status}): ${errorMessage || response.statusText}`,
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    Array.isArray(result) ||
    !("acknowledged" in result) ||
    result.acknowledged !== true ||
    !("insertedId" in result) ||
    typeof result.insertedId !== "string" ||
    !result.insertedId
  ) {
    throw new Error("The loan API did not confirm that your application was saved");
  }

  return { insertedId: result.insertedId };
}
export interface LoanApplicationAdminNote {
  loanApplicationId: string;
  staffNote: string;
}

export async function loneRequestAdmin(
  data: LoanApplicationAdminNote,
): Promise<{ insertedId: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "staff") {
    throw new Error("Only staff can send loan applications to admin");
  }
  if (!data || typeof data !== "object") {
    throw new Error("Loan review details are required");
  }
  if (!ObjectId.isValid(data.loanApplicationId)) {
    throw new Error("Invalid loan application ID");
  }

  const staffNote = validateTextField(data.staffNote, "Staff note", 2000, true);
  const loanApplicationId = new ObjectId(data.loanApplicationId);
  const loanCollection = bankingDb.collection("loan-application");
  const adminLoanCollection = bankingDb.collection("loan-application-admin");
  const dbSession = mongoClient.startSession();

  try {
    const outcome = await dbSession.withTransaction(async () => {
      const loanApplication = await loanCollection.findOne(
        { _id: loanApplicationId },
        { session: dbSession },
      );
      if (!loanApplication) throw new Error("Loan application was not found");
      if (
        String(loanApplication.applicationStatus ?? "").toLowerCase() !==
        "pending"
      ) {
        throw new Error("This loan application is no longer awaiting staff review");
      }

      const sentAt = new Date().toISOString();
      const staffName =
        typeof session.user.name === "string" ? session.user.name : "";
      const updateResult = await loanCollection.updateOne(
        { _id: loanApplicationId, applicationStatus: "pending" },
        {
          $set: {
            applicationStatus: "sent_for_admin",
            staffNote,
            sentAt,
            staffUserId: session.user.id,
            staffName,
          },
        },
        { session: dbSession },
      );
      if (updateResult.matchedCount !== 1) {
        throw new Error("Loan status changed before it could be sent to admin");
      }

      const adminRecord: Document = {
        ...loanApplication,
        loanApplicationId: loanApplicationId.toHexString(),
        applicationStatus: "sent_for_admin",
        staffNote,
        sentAt,
        staffUserId: session.user.id,
        staffName,
      };
      delete adminRecord._id;

      const insertResult = await adminLoanCollection.insertOne(adminRecord, {
        session: dbSession,
      });
      if (!insertResult.acknowledged) {
        throw new Error("The loan review could not be sent to admin");
      }

      return { insertedId: insertResult.insertedId.toString() };
    });

    if (!outcome) throw new Error("Sending the loan review did not complete");
    revalidatePath("/dashboard/staff/lon-application");
    revalidatePath("/dashboard/admin/admin-loan-applications");
    revalidatePath("/dashboard/coustomer/lone");
    return outcome;
  } finally {
    await dbSession.endSession();
  }
};
