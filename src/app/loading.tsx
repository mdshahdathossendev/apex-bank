export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-[#173c35]">
      <div
        aria-live="polite"
        className="flex flex-col items-center text-center"
        role="status"
      >
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#e7efe8]">
          <span className="size-7 rounded-full border-[3px] border-[#cbd9d1] border-t-[#174b41] motion-safe:animate-spin" />
        </div>
        <p className="text-sm font-semibold">Apex Bank</p>
        <p className="mt-2 text-sm text-[#718078]">
          Loading your secure banking experience...
        </p>
      </div>
    </main>
  );
}
