import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footerLabel: string;
  footerLink: string;
  footerHref: "/sinin" | "/sinup";
  title: string;
};

function BankLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#123f38] shadow-lg shadow-black/10">
        <svg
          aria-hidden="true"
          className="size-7"
          fill="none"
          viewBox="0 0 32 32"
        >
          <path
            d="m5 12 11-7 11 7H5Z"
            fill="currentColor"
            opacity=".22"
          />
          <path
            d="m5 12 11-7 11 7H5Zm2 2h18M8 14v10m5-10v10m6-10v10m5-10v10M6 26h20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        Apex <span className="font-normal text-white/70">Bank</span>
      </span>
    </div>
  );
}

export default function AuthShell({
  children,
  description,
  footerLabel,
  footerLink,
  footerHref,
  title,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] p-3 text-[#17211f] sm:p-5">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_90px_-40px_rgba(19,54,46,0.28)] lg:min-h-[min(620px,calc(100vh-2.5rem))] lg:grid-cols-[1fr_0.95fr]">
        <aside className="relative isolate flex min-h-[190px] flex-col overflow-hidden bg-[#123f38] px-6 py-6 text-white sm:min-h-[220px] sm:px-8 sm:py-7 lg:min-h-full lg:px-10 lg:py-9">
          <div className="absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full border border-white/[0.08]" />
          <div className="absolute -right-16 -top-16 -z-10 size-[20rem] rounded-full border border-white/[0.1]" />
          <div className="absolute -bottom-48 -left-32 -z-10 size-[28rem] rounded-full bg-[#a2c9a8]/10 blur-3xl" />

          <BankLogo />

          <div className="my-auto max-w-xl py-7 lg:py-10">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-medium tracking-wide text-white/85">
              <span className="size-1.5 rounded-full bg-[#a2d2a4]" />
              BANKING, MADE PERSONAL
            </p>
            <h1 className="max-w-lg text-3xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              A clearer way to move{" "}
              <span className="text-[#a8d5b0]">forward.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">
              Your money, your plans, all in one secure place. Welcome to
              banking that keeps up with you.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-white/15 pt-4 text-xs text-white/60 sm:text-sm">
            <svg
              aria-hidden="true"
              className="size-4 text-[#a8d5b0]"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M10 2.5 4 5v4.2c0 3.8 2.6 6.8 6 8.3 3.4-1.5 6-4.5 6-8.3V5l-6-2.5Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
              <path
                d="m7.5 9.8 1.7 1.7 3.5-3.7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Your account is protected with secure sign-in
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          <div className="w-full max-w-[380px]">
            <div className="mb-7">
              <p className="mb-2 text-sm font-medium text-[#47796e]">
                Welcome to Apex Bank
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#75807d]">
                {description}
              </p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-[#75807d]">
              {footerLabel}{" "}
              <Link
                className="font-semibold text-[#216457] transition hover:text-[#123f38]"
                href={footerHref}
              >
                {footerLink}
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-[#9aa29f]">
              Apex Bank. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
