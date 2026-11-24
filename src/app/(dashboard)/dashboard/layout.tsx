
import CustomerSidebar from "@/Component/CustomerSidebar";
import AdminSidebar from "@/Component/Sideber";
import StaffSidebar from "@/Component/StaffSidebar";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = (await headers()).get("x-authenticated-role");
  if (!role) redirect("/sinin");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">

      {role === "admin" && <AdminSidebar />}

      {role === "staff" && <StaffSidebar />}

      {role === "customer" && <CustomerSidebar />}

      <main className="min-w-0 flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}