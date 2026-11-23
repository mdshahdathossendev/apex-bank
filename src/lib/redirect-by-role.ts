import { useRouter } from "next/navigation";

export function redirectByRole(
  role: string,
  router: ReturnType<typeof useRouter>
) {
  switch (role) {
    case "Admin":
      router.push("/dashboard/admin");
      break;

    case "Staff":
      router.push("/dashboard/staff");
      break;

    case "Customer":
      router.push("/dashboard/customer");
      break;

    default:
      router.push("/login");
  }
}