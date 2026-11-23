import Link from "next/link";
import { Settings } from "lucide-react";

export default function CustomerSettingsPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Settings size={26} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Customer settings are not available yet.
      </p>
      <Link
        href="/dashboard/coustomer"
        className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Back to overview
      </Link>
    </section>
  );
}
