import CustomerPersonalDataEditor from "@/Component/CustomerPersonalDataEditor";

export default async function AdminEditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CustomerPersonalDataEditor
      userId={id}
      backHref="/dashboard/admin/all-customers"
    />
  );
}
