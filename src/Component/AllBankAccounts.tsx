"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Wallet } from "lucide-react";
import type { BankAccountSummary } from "@/lib/data";

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
}: {
  accounts: BankAccountSummary[];
}) {
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");

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
      return [
        account.accountNumber,
        account.name,
        account.userId,
        account.accountType,
        account.branchId,
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
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.accountNumber}
                    className="transition hover:bg-gray-50/80"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {account.name || "Name unavailable"}
                      </p>
                      {account.userId ? (
                        <p className="mt-1 text-xs text-gray-400">
                          Customer ID: {account.userId}
                        </p>
                      ) : null}
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
                        <span className="text-xs text-gray-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
