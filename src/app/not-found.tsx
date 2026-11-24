import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 py-12 text-[#173c35]">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-lg text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#56816b]">
          Apex Bank
        </p>
        <p
          aria-hidden="true"
          className="mt-8 text-8xl font-semibold tracking-[-0.08em] text-[#dce9df] sm:text-9xl"
        >
          404
        </p>
        <h1
          className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
          id="not-found-title"
        >
          We can&apos;t find that page
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#718078]">
          The page may have moved, or the address may be incorrect.
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[#174b41] px-6 text-sm font-semibold text-white transition hover:bg-[#103b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#377c6d]"
          href="/"
        >
          Return to home
        </Link>
      </section>
    </main>
  );
}
