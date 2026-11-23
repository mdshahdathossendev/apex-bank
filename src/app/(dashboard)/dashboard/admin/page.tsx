
import {
  Users,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

const stats = [
  {
    title: "Total Customers",
    value: "2,450",
    change: "+12.5%",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Total Accounts",
    value: "3,820",
    change: "+8.2%",
    icon: Wallet,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Total Balance",
    value: "৳85.4M",
    change: "+15.3%",
    icon: TrendingUp,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Transactions",
    value: "12,580",
    change: "+5.4%",
    icon: ArrowLeftRight,
    color: "bg-orange-100 text-orange-600",
  },
];

const transactions = [
  {
    id: "#TRX-1024",
    customer: "Rahim Ahmed",
    type: "Deposit",
    amount: "+৳25,000",
    status: "Completed",
  },
  {
    id: "#TRX-1025",
    customer: "Karim Hasan",
    type: "Withdrawal",
    amount: "-৳5,000",
    status: "Pending",
  },
  {
    id: "#TRX-1026",
    customer: "Sadia Islam",
    type: "Transfer",
    amount: "-৳12,000",
    status: "Completed",
  },
  {
    id: "#TRX-1027",
    customer: "Nusrat Jahan",
    type: "Deposit",
    amount: "+৳18,000",
    status: "Failed",
  },
];

const loans = [
  {
    name: "Abdullah Al Mamun",
    amount: "৳200,000",
    date: "Nov 20, 2026",
  },
  {
    name: "Fatema Akter",
    amount: "৳150,000",
    date: "Nov 19, 2026",
  },
  {
    name: "Sabbir Hossain",
    amount: "৳300,000",
    date: "Nov 18, 2026",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here is what's happening with your bank.
          </p>
        </div>

        <div className="rounded-lg border bg-white px-4 py-2 text-sm text-gray-600">
          November 21, 2026
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={23} />
                </div>

                <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <TrendingUp size={14} />
                  {item.change}
                </span>
              </div>

              <p className="mt-5 text-sm text-gray-500">
                {item.title}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Transaction and Loan Summary */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Recent Transactions */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-gray-900">
                Recent Transactions
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest banking activities
              </p>
            </div>

            <button className="text-sm font-semibold text-blue-600">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-700">
                      {trx.id}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {trx.customer}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {trx.type}
                    </td>

                    <td className={`px-5 py-4 font-semibold ${
                      trx.amount.startsWith("+")
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}>
                      {trx.amount}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        trx.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : trx.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loan Requests */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-gray-900">
                Loan Requests
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Pending approval
              </p>
            </div>

            <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
              <HandCoins size={20} />
            </div>
          </div>

          <div className="space-y-5 p-5">
            {loans.map((loan, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <h3 className="text-sm font-semibold text-gray-800">
                  {loan.name}
                </h3>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {loan.amount}
                  </span>

                  <span className="text-xs text-gray-400">
                    {loan.date}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg bg-green-50 py-2 text-xs font-semibold text-green-600 hover:bg-green-100">
                    Approve
                  </button>

                  <button className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-green-100 p-3 text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Approved Loans</p>
            <h3 className="text-xl font-bold text-gray-900">128</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Loans</p>
            <h3 className="text-xl font-bold text-gray-900">24</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
          <div className="rounded-xl bg-red-100 p-3 text-red-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Rejected Loans</p>
            <h3 className="text-xl font-bold text-gray-900">12</h3>
          </div>
        </div>
      </div>

    </div>
  );
}
