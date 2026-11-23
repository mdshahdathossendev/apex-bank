"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getAccountByUserId, type UserAccount } from "@/lib/data";

export default function CustomerProfilePage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    if (!userId) {
      setAccount(null);
      setIsAccountLoading(false);
      return;
    }

    let active = true;
    setAccount(null);
    setIsAccountLoading(true);
    setAccountError("");

    getAccountByUserId(userId)
      .then((userAccount) => {
        if (active) setAccount(userAccount);
      })
      .catch((error: unknown) => {
        if (active) {
          setAccountError(
            error instanceof Error
              ? error.message
              : "Could not load your bank account",
          );
        }
      })
      .finally(() => {
        if (active) setIsAccountLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const name = user?.name?.trim() || "Customer";
  const email = user?.email || "Not provided";
  const initials = name.charAt(0).toUpperCase();
  const customerReference = userId ? `••••${userId.slice(-6)}` : "Unavailable";
  const maskedAccountNumber = account?.accountNumber
    ? `•••• •••• ${account.accountNumber.slice(-4)}`
    : null;

  return (
    <main className="mx-auto max-w-5xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-1 ring-white/20">
              {isSessionPending ? <UserRound size={28} /> : initials}
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">
                CUSTOMER PROFILE
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {isSessionPending ? "Loading profile..." : name}
              </h1>
              <p className="mt-1 text-sm text-white/75">{email}</p>
            </div>
          </div>
          <Link
            href="/dashboard/coustomer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Personal information
              </h2>
              <p className="text-xs text-gray-500">
                Details from your signed-in profile
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <UserRound size={15} />
                Full name
              </dt>
              <dd className="mt-2 break-words font-semibold text-gray-900">
                {isSessionPending ? "Loading..." : name}
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Mail size={15} />
                Email address
              </dt>
              <dd className="mt-2 break-words font-semibold text-gray-900">
                {isSessionPending ? "Loading..." : email}
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <ShieldCheck size={15} />
                Customer reference
              </dt>
              <dd className="mt-2 font-semibold text-gray-900">
                {customerReference}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Bank account</h2>
                <p className="text-xs text-gray-500">
                  Linked to this profile
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Account number
                </span>
                <CreditCard className="text-blue-700" size={18} />
              </div>
              <p className="mt-2 font-semibold text-gray-900">
                {isSessionPending || isAccountLoading
                  ? "Loading account..."
                  : maskedAccountNumber ||
                    (account
                      ? "Account number not assigned"
                      : "No linked account")}
              </p>
              {account?.accountType && (
                <p className="mt-1 text-xs text-gray-500">
                  {account.accountType} account
                </p>
              )}
              {accountError && (
                <p className="mt-2 text-xs text-red-700" role="alert">
                  {accountError}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-teal-700" size={19} />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Profile security
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your profile details are read-only here and come from your
                  authenticated account.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
