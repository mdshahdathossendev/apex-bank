import Link from "next/link";
import { Check } from "lucide-react";

export interface ActionSuccessDetail {
  label: string;
  value: string;
}

export default function ActionSuccessPage({
  title,
  description,
  details = [],
  primaryLabel,
  primaryHref,
  onContinue,
  secondaryHref,
  secondaryLabel = "Dashboard",
}: {
  title: string;
  description: string;
  details?: ActionSuccessDetail[];
  primaryLabel: string;
  primaryHref?: string;
  onContinue?: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <main
      aria-live="polite"
      className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center"
    >
      <section className="w-full rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check aria-hidden="true" size={34} strokeWidth={3} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600">
          {description}
        </p>

        {details.length > 0 && (
          <dl className="mx-auto mt-6 max-w-lg divide-y divide-gray-100 rounded-xl border border-gray-100 text-left">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"
              >
                <dt className="text-gray-500">{detail.label}</dt>
                <dd className="break-all text-right font-semibold text-gray-900">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {primaryLabel}
            </button>
          ) : (
            primaryHref && (
              <Link
                href={primaryHref}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                {primaryLabel}
              </Link>
            )
          )}
          {secondaryHref && (
            <Link
              href={secondaryHref}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
