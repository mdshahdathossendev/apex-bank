"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Mail,
  MapPin,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import type {
  BankAccountSummary,
  CustomerAccountContact,
} from "@/lib/data";

function formatCurrency(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "Not recorded";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusStyle(status: string): string {
  return isAccountActive(status)
    ? "bg-emerald-50 text-emerald-700"
    : "bg-gray-100 text-gray-700";
}

function isAccountActive(status: string): boolean {
  return status.toLowerCase() === "active";
}

export default function AllBankAccounts({
  accounts,
  customers,
}: {
  accounts: BankAccountSummary[];
  customers: CustomerAccountContact[];
}) {
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const customerEmails = useMemo(() => {
    const emails = new Map<string, string>();
    for (const customer of customers) {
      if (!customer.email) continue;
      if (customer.id) emails.set(customer.id, customer.email);
      if (customer.databaseId) emails.set(customer.databaseId, customer.email);
    }
    return emails;
  }, [customers]);

  const accountTypes = useMemo(
    () =>
      Array.from(
        new Set(
          accounts
            .map((account) => account.accountType?.trim())
            .filter((type): type is string => Boolean(type)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [accounts],
  );
  const filteredAccounts = accounts
    .filter((account) => {
      if (accountType !== "all" && account.accountType !== accountType) {
        return false;
      }
      if (
        accountStatus === "active" &&
        !isAccountActive(account.status)
      ) {
        return false;
      }
      if (
        accountStatus === "inactive" &&
        isAccountActive(account.status)
      ) {
        return false;
      }

      const query = search.trim().toLowerCase();
      const email = customerEmails.get(account.userId ?? "") ?? "";
      return [
        account.accountNumber,
        account.name,
        email,
        account.userId,
        account.accountType,
        account.branchId,
        account.fatherName,
        account.motherName,
        account.dateOfBirth,
        account.gender,
        account.nationality,
        account.maritalStatus,
        account.nidNumber,
        account.occupation,
        account.presentAddress,
        account.permanentAddress,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((left, right) =>
      left.accountNumber.localeCompare(right.accountNumber),
    );

  const activeCount = accounts.filter((account) =>
    isAccountActive(account.status),
  ).length;
  const totalBalance = accounts.reduce(
    (total, account) => total + (account.balance ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-blue-100">ADMIN DASHBOARD</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">All bank accounts</h1>
            <p className="mt-2 text-sm text-white/75">
              Account records from the banking database.
            </p>
          </div>
          <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            {accounts.length.toLocaleString("en-BD")} accounts
          </span>
        </div>
      </header>

      <section
        aria-label="Account summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Wallet size={22} />
          </span>
          <div>
            <p className="text-sm text-gray-500">Total accounts</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {accounts.length.toLocaleString("en-BD")}
            </p>
          </div>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active accounts</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {activeCount.toLocaleString("en-BD")}
          </p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total recorded balance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(totalBalance)}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bank accounts</h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredAccounts.length} of {accounts.length}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(240px,1fr)_160px_150px]">
            <label className="relative block">
              <span className="sr-only">Search bank accounts</span>
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search account, customer, branch..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="sr-only" htmlFor="account-type-filter">
              Filter by account type
            </label>
            <select
              id="account-type-filter"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All account types</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="account-status-filter">
              Filter by account status
            </label>
            <select
              id="account-status-filter"
              value={accountStatus}
              onChange={(event) => setAccountStatus(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-semibold text-gray-900">
              {accounts.length === 0
                ? "No bank accounts found"
                : "No matching accounts"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {accounts.length === 0
                ? "Bank accounts will appear here when they are opened."
                : "Try changing the search or account filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Account holder</th>
                  <th className="px-5 py-4 font-semibold">Account number</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Branch</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Initial deposit
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Current balance
                  </th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAccounts.map((account) => {
                  const email = customerEmails.get(account.userId ?? "");
                  const isExpanded =
                    expandedAccount === account.accountNumber;
                  const panelId = `customer-profile-${account.accountNumber}`;
                  const initials =
                    account.name
                      ?.trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "CU";
                  const customerDetails = [
                    ["Email", email],
                    ["Father's name", account.fatherName],
                    ["Mother's name", account.motherName],
                    ["Date of birth", account.dateOfBirth],
                    ["Gender", account.gender],
                    ["Nationality", account.nationality],
                    ["Marital status", account.maritalStatus],
                    ["Occupation", account.occupation],
                    ["NID", account.nidNumber],
                  ] as const;

                  return (
                    <Fragment key={account.accountNumber}>
                      <tr className="transition hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">
                                {account.name || "Name unavailable"}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                <Mail aria-hidden="true" size={13} />
                                <span className="break-all">
                                  {email || "Email unavailable"}
                                </span>
                              </p>
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={isExpanded ? panelId : undefined}
                                onClick={() =>
                                  setExpandedAccount(
                                    isExpanded ? null : account.accountNumber,
                                  )
                                }
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                              >
                                {isExpanded ? "Hide details" : "View details"}
                                {isExpanded ? (
                                  <ChevronUp aria-hidden="true" size={14} />
                                ) : (
                                  <ChevronDown aria-hidden="true" size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">
                          {account.accountNumber}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {account.accountType || "Not recorded"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {account.branchId || "Not recorded"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-gray-600">
                          {formatCurrency(account.initialDeposit)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(account.status)}`}
                          >
                            {account.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {account.userId ? (
                            <Link
                              href={`/dashboard/admin/edit-customer/${encodeURIComponent(account.userId)}`}
                              className="whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Edit customer
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr id={panelId} className="bg-slate-50/80">
                          <td colSpan={8} className="p-4 sm:p-6">
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <header className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-900 to-teal-700 px-5 py-4 text-white">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                                    <UserRound
                                      aria-hidden="true"
                                      size={22}
                                    />
                                  </span>
                                  <div>
                                    <h3 className="font-semibold">
                                      Customer profile
                                    </h3>
                                    <p className="mt-0.5 text-xs text-blue-100">
                                      {account.name || "Name unavailable"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs text-blue-100">
                                  Account {account.accountNumber}
                                </div>
                              </header>

                              <div className="p-5">
                                <div className="mb-3 flex items-center gap-2">
                                  <Fingerprint
                                    aria-hidden="true"
                                    className="text-blue-700"
                                    size={17}
                                  />
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    Personal information
                                  </h4>
                                </div>
                                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  {customerDetails.map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                                    >
                                      <dt className="text-xs font-medium text-gray-500">
                                        {label}
                                      </dt>
                                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                                        {value?.trim() || "Not recorded"}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                  {[
                                    [
                                      "Present address",
                                      account.presentAddress,
                                    ],
                                    [
                                      "Permanent address",
                                      account.permanentAddress,
                                    ],
                                  ].map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                                    >
                                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
                                        <MapPin
                                          aria-hidden="true"
                                          size={15}
                                        />
                                        {label}
                                      </h4>
                                      <p className="mt-2 break-words text-sm leading-6 text-gray-700">
                                        {value?.trim() || "Not recorded"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
