
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  UserPlus,
  Settings,
  Landmark,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

const menuItems = [
  {
    title: "Overview",
    href: "/dashboard/staff",
    icon: LayoutDashboard,
  },
  {
    title: "All Customer",
    href: "/dashboard/staff/all-users",
    icon: UserPlus,
  },
  {
    title: "Transactions",
    href: "/dashboard/staff/all-transaction",
    icon: ArrowLeftRight,
  },
  {
    title: "Loan Requests",
    href: "/dashboard/staff/lon-application",
    icon: HandCoins,
  },
];

export default function StaffSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen max-h-screen w-64 shrink-0 self-start flex-col overflow-hidden border-r border-gray-200 bg-white p-5">
      {/* Logo */}
      <Link href="/dashboard/staff" className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 text-white">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">BankPro</h1>
          <p className="text-xs text-gray-500">Banking Management</p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Staff Menu
      </p>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/staff" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={19} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-gray-200 pt-4">
        <Link
          href="/dashboard/staff/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-600 hover:bg-gray-100"
        >
          <Settings size={19} />
          Settings
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}
