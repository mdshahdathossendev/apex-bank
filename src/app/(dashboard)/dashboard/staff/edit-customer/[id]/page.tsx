import CustomerPersonalDataEditor from "@/Component/CustomerPersonalDataEditor";

export default async function StaffEditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CustomerPersonalDataEditor
      userId={id}
      backHref="/dashboard/staff/all-users"
    />
  );
}
