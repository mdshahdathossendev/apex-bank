import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  HandCoins,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const services = [
  {
    icon: WalletCards,
    title: "Accounts, made clear",
    description:
      "Keep your account details and available balance easy to find.",
  },
  {
    icon: ArrowUpRight,
    title: "Move money simply",
    description:
      "Review deposits, withdrawals, transfers, and your transaction history.",
  },
  {
    icon: HandCoins,
    title: "Plan your next step",
    description:
      "Explore loan applications and follow their progress in one place.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8f5] text-[#173c35]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-40 size-[520px] rounded-full bg-[#dcebe3]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-[540px] size-[420px] rounded-full bg-[#e8eee1]/80 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#dce5df] py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#174b41] text-white shadow-sm">
              <Landmark aria-hidden="true" size={23} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight tracking-[-0.04em]">
                Apex Bank
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a8179]">
                Banking, with clarity
              </p>
            </div>
          </div>
          <Link
            href="/sinin"
            className="inline-flex items-center gap-2 rounded-full border border-[#cbd9d1] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#174b41] shadow-sm transition hover:border-[#174b41] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#377c6d]"
          >
            Sign in
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5e4d9] bg-white/75 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#386b59] shadow-sm">
              <span className="size-2 rounded-full bg-[#5b9c75]" />
              A clearer way to bank
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.065em] text-[#153b34] sm:text-6xl lg:text-7xl">
              Your money.
              <br />
              Your next move.
              <span className="mt-2 block font-serif text-5xl font-normal italic tracking-[-0.055em] text-[#56816b] sm:text-6xl lg:text-7xl">
                Made simpler.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#60746c] sm:text-lg sm:leading-8">
              A more considered banking experience for everyday account
              management, money movement, and the plans you are working toward.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/sinin"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#174b41] px-7 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(23,75,65,0.65)] transition hover:-translate-y-0.5 hover:bg-[#103b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#377c6d]"
              >
                Sign in to your account
                <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-0.5">
                  <ArrowRight aria-hidden="true" size={16} />
                </span>
              </Link>
              <span className="text-xs text-[#7b8c85]">
                Your Apex Bank dashboard, in one place.
              </span>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#526b61]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#e5eee7] text-[#3d735b]">
                <ShieldCheck aria-hidden="true" size={18} />
              </span>
              Sign in securely to access your banking tools
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px]">
            <div
              aria-hidden="true"
              className="absolute -left-5 top-16 size-24 rounded-full border border-[#c8d9ce] sm:-left-10 sm:size-32"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -right-2 size-28 rounded-full border border-[#c8d9ce] sm:-right-8 sm:size-36"
            />
            <div className="relative overflow-hidden rounded-[2rem] bg-[#153f37] p-5 text-white shadow-[0_32px_80px_-36px_rgba(22,70,59,0.65)] sm:p-7">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-12 size-52 rounded-full border border-white/10"
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                      APEX BANK
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                      Banking at a glance
                    </h2>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <Landmark aria-hidden="true" size={20} />
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm sm:p-6">
                  <div className="flex items-center justify-between text-sm text-white/65">
                    <span>Account overview</span>
                    <span className="rounded-full bg-[#a5d6ad]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#b8e3bf]">
                      Your dashboard
                    </span>
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/55">
                    Your account details
                  </p>
                  <p className="mt-2 text-2xl font-medium tracking-[0.12em] text-white/90">
                    •••• &nbsp; ••••
                  </p>
                  <div className="mt-6 h-px bg-white/15" />
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/75">
                      <WalletCards aria-hidden="true" size={17} />
                      Accounts and activity
                    </div>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="text-[#b8e3bf]"
                      size={19}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.08] p-4">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#a5d6ad]/15 text-[#b8e3bf]">
                      <ArrowUpRight aria-hidden="true" size={18} />
                    </div>
                    <p className="mt-3 text-sm font-medium">Transfers</p>
                    <p className="mt-1 text-xs text-white/55">
                      Review and move money
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.08] p-4">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#a5d6ad]/15 text-[#b8e3bf]">
                      <HandCoins aria-hidden="true" size={18} />
                    </div>
                    <p className="mt-3 text-sm font-medium">Loan tools</p>
                    <p className="mt-1 text-xs text-white/55">
                      Keep plans in view
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-5 flex items-center justify-center gap-2 text-xs text-[#71847b]">
              <ShieldCheck aria-hidden="true" size={15} />
              A simple view of the tools available after sign in
            </div>
          </div>
        </section>

        <section
          aria-label="Banking tools"
          className="grid gap-3 border-t border-[#dce5df] py-8 sm:grid-cols-3 sm:gap-5 sm:py-10"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="flex gap-4 rounded-2xl px-3 py-3 sm:px-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7efe8] text-[#376b56]">
                  <Icon aria-hidden="true" size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#244b3f]">
                    {service.title}
                  </h2>
                  <p className="mt-1.5 max-w-xs text-xs leading-5 text-[#718078]">
                    {service.description}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#dce5df] py-5 text-xs text-[#819087] sm:flex-row sm:items-center sm:justify-between">
          <span>© Apex Bank</span>
          <span>Thoughtful banking for what comes next.</span>
        </footer>
      </div>
    </main>
  );
}
