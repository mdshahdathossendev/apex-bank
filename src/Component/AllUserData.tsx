"use client";

import { useState } from "react";
import Link from "next/link";
import { LockKeyhole, Search, UnlockKeyhole, Users } from "lucide-react";
import { setCustomerBlocked } from "@/lib/action";

interface CustomerRecord extends Record<string, unknown> {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  email?: unknown;
  role?: unknown;
  emailVerified?: unknown;
  createdAt?: unknown;
  banned?: unknown;
}

function isCustomerRecord(value: unknown): value is CustomerRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function recordId(customer: CustomerRecord): string {
  const id = customer._id ?? customer.id;
  if (typeof id === "string" || typeof id === "number") return String(id);
  if (
    typeof id === "object" &&
    id !== null &&
    "$oid" in id &&
    typeof id.$oid === "string"
  ) {
    return id.$oid;
  }
  return "";
}

function joinedDate(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Date unavailable";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
  }).format(date);
}

export function AllUserData({
  data,
  dashboardBase = "staff",
}: {
  data: unknown;
  dashboardBase?: "staff" | "admin";
}) {
  const [search, setSearch] = useState("");
  const [blockedOverrides, setBlockedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [updatingCustomerId, setUpdatingCustomerId] = useState<string | null>(
    null,
  );
  const [accessMessage, setAccessMessage] = useState("");
  const [accessError, setAccessError] = useState("");
  const users = Array.isArray(data) ? data.filter(isCustomerRecord) : [];
  const customers = users.filter((user) => {
    const role = text(user.role).toLowerCase();
    return role === "customer";
  });
  const verifiedCount = customers.filter(
    (customer) => customer.emailVerified === true,
  ).length;
  const query = search.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.email, recordId(customer)]
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase()
      .includes(query),
  );

  async function toggleCustomerAccess(id: string, blocked: boolean) {
    setUpdatingCustomerId(id);
    setAccessMessage("");
    setAccessError("");
    try {
      const result = await setCustomerBlocked(id, blocked);
      setBlockedOverrides((current) => ({ ...current, [id]: result.blocked }));
      setAccessMessage(result.message);
    } catch (error) {
      setAccessError(
        error instanceof Error
          ? error.message
          : "The customer account status could not be updated.",
      );
    } finally {
      setUpdatingCustomerId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-blue-100">
          {dashboardBase.toUpperCase()} DASHBOARD
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Customer list</h1>
            <p className="mt-2 text-sm text-white/75">
              Customer records loaded from the banking database.
            </p>
          </div>
          <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
            {customers.length.toLocaleString("en-BD")} customers
          </span>
        </div>
      </header>

      <section
        aria-label="Customer summary"
        className="grid gap-4 sm:grid-cols-2"
      >
        <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Users size={22} />
          </span>
          <div>
            <p className="text-sm text-gray-500">Total customers</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {customers.length.toLocaleString("en-BD")}
            </p>
          </div>
        </article>
        <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Users size={22} />
          </span>
          <div>
            <p className="text-sm text-gray-500">Email verified</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {verifiedCount.toLocaleString("en-BD")}
            </p>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {accessMessage || accessError ? (
          <p
            role={accessError ? "alert" : "status"}
            className={`border-b px-5 py-3 text-sm ${
              accessError
                ? "border-red-100 bg-red-50 text-red-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {accessError || accessMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All customers
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length}
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              aria-label="Search customers"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or ID..."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-semibold text-gray-900">
              {customers.length === 0
                ? "No customers found"
                : "No matching customers"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {customers.length === 0
                ? "Customer profiles will appear here when available."
                : "Try searching with a different name, email, or ID."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className={`w-full text-left text-sm ${
                dashboardBase === "admin" ? "min-w-[1000px]" : "min-w-[900px]"
              }`}
            >
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                  <th className="px-5 py-4 font-semibold">Verification</th>
                  {dashboardBase === "admin" ? (
                    <th className="px-5 py-4 font-semibold">Access</th>
                  ) : null}
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer, index) => {
                  const id = recordId(customer);
                  const name = text(customer.name) || "Unnamed customer";
                  const email = text(customer.email) || "Email unavailable";
                  const key = id || email || `${name}-${index}`;
                  const isVerified = customer.emailVerified === true;
                  const isBlocked =
                    blockedOverrides[id] ?? customer.banned === true;

                  return (
                    <tr key={key} className="transition hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{name}</p>
                        {id && (
                          <p className="mt-1 text-xs text-gray-400">
                            ID: {id}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{email}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {joinedDate(customer.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            isVerified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isVerified ? "Verified" : "Not verified"}
                        </span>
                      </td>
                      {dashboardBase === "admin" ? (
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              isBlocked
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isBlocked ? "Blocked" : "Unblocked"}
                          </span>
                        </td>
                      ) : null}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {id ? (
                            <>
                              {dashboardBase === "staff" ? (
                                <Link
                                  href={`/dashboard/staff/accounet-dtels/${encodeURIComponent(id)}`}
                                  className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  View details
                                </Link>
                              ) : null}
                              <Link
                                href={`/dashboard/${dashboardBase}/edit-customer/${encodeURIComponent(id)}`}
                                className="whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                Edit details
                              </Link>
                              {dashboardBase === "admin" ? (
                                <button
                                  type="button"
                                  disabled={updatingCustomerId !== null}
                                  onClick={() =>
                                    void toggleCustomerAccess(id, !isBlocked)
                                  }
                                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    isBlocked
                                      ? "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                      : "border border-red-200 text-red-700 hover:bg-red-50"
                                  }`}
                                >
                                  {isBlocked ? (
                                    <UnlockKeyhole size={14} aria-hidden="true" />
                                  ) : (
                                    <LockKeyhole size={14} aria-hidden="true" />
                                  )}
                                  {updatingCustomerId === id
                                    ? isBlocked
                                      ? "Unblocking..."
                                      : "Blocking..."
                                    : isBlocked
                                      ? "Unblock"
                                      : "Block"}
                                </button>
                              ) : null}
                              {dashboardBase === "staff" ? (
                                <Link
                                  href={`/dashboard/staff/create-accounet?customerId=${encodeURIComponent(id)}`}
                                  className="whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                                >
                                  Create account
                                </Link>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              ID unavailable
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
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
