
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
    <aside className="sticky top-0 z-30 flex w-full shrink-0 flex-col overflow-hidden border-b border-gray-200 bg-white px-3 py-3 lg:h-dvh lg:w-64 lg:self-start lg:border-b-0 lg:border-r lg:p-5">
      <Link
        href="/dashboard/admin"
        className="mb-3 flex items-center gap-2 lg:mb-8 lg:gap-3"
      >
        <div className="rounded-xl bg-blue-600 p-2 lg:p-2.5">
          <Landmark className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">BankPro</h1>
          <p className="text-xs text-gray-500">Banking Management</p>
        </div>
      </Link>

      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:block">
        Main Menu
      </p>

      <nav
        aria-label="Admin navigation"
        className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0"
      >
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
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition lg:shrink lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-sm ${
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

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 pt-2 lg:mt-auto lg:block lg:space-y-1 lg:pt-4">
        <Link
          href="/dashboard/admin/settings"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 lg:w-full lg:gap-3 lg:px-3 lg:py-3 lg:text-sm"
        >
          <Settings size={19} />
          Settings
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}
