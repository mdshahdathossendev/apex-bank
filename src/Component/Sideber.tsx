
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  Settings,
  Landmark,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

const menuItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/dashboard/admin/all-customers",
    icon: Users,
  },
  {
    title: "Accounts",
    href: "/dashboard/admin/all-accounts",
    icon: Wallet,
  },
  {
    title: "Transactions",
    href: "/dashboard/admin/all-transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Loan Management",
    href: "/dashboard/admin/admin-loan-applications",
    icon: HandCoins,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 self-start flex-col overflow-hidden border-r border-gray-200 bg-white p-5">
      <Link href="/dashboard/admin" className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 text-white">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">BankPro</h1>
          <p className="text-xs text-gray-500">Banking Management</p>
        </div>
      </Link>

      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Main Menu
      </p>

      <nav className="min-h-0 flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/admin" &&
              pathname.startsWith(item.href + "/"));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={19} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-gray-200 pt-4">
        <Link
          href="/dashboard/admin/settings"
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
