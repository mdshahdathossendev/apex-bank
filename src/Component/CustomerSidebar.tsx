
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  HandCoins,
  UserRound,
  Settings,
  Landmark,
  History,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

const menuItems = [
  {
    title: "Overview",
    href: "/dashboard/coustomer",
    icon: LayoutDashboard,
  },
  {
    title: "My Accounts",
    href: "/dashboard/coustomer/my-account",
    icon: Wallet,
  },
  {
    title: "Transfer Money",
    href: "/dashboard/coustomer/transfer",
    icon: ArrowLeftRight,
  },
  {
    title: "Deposit Request",
    href: "/dashboard/coustomer/deposite",
    icon: ArrowDownToLine,
  },
  {
    title: "Withdraw Request",
    href: "/dashboard/coustomer/withdrawal",
    icon: ArrowUpFromLine,
  },
  {
    title: "Transactions",
    href: "/dashboard/coustomer/my-tranactions",
    icon: History,
  },
  {
    title: "My Loans",
    href: "/dashboard/coustomer/lone",
    icon: HandCoins,
  },
  {
    title: "My Profile",
    href: "/dashboard/coustomer/profile",
    icon: UserRound,
  },
];

export default function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen max-h-screen w-64 shrink-0 self-start flex-col overflow-hidden border-r border-gray-200 bg-white p-5">
      {/* Logo */}
      <Link href="/dashboard/coustomer" className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 text-white">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">BankPro</h1>
          <p className="text-xs text-gray-500">Online Banking</p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Banking Menu
      </p>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/coustomer" &&
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
          href="/dashboard/coustomer/settings"
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
