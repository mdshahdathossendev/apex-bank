export type LoanWorkflowStage =
  | "review"
  | "sent_for_admin"
  | "accepted"
  | "rejected"
  | "other";

export function getLoanWorkflowStage(value: unknown): LoanWorkflowStage {
  if (typeof value !== "string") return "other";

  const status = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (status.includes("sent_for_admin") || status.includes("sent_to_admin")) {
    return "sent_for_admin";
  }
  if (
    status.includes("pending") ||
    status.includes("process") ||
    status.includes("review")
  ) {
    return "review";
  }
  if (
    status.includes("success") ||
    status.includes("approved") ||
    status.includes("accepted")
  ) {
    return "accepted";
  }
  if (
    status.includes("reject") ||
    status.includes("denied") ||
    status.includes("failed")
  ) {
    return "rejected";
  }
  return "other";
}

export function getLoanStatusLabel(
  value: unknown,
  pendingLabel = "Review for Staff",
): string {
  switch (getLoanWorkflowStage(value)) {
    case "review":
      return pendingLabel;
    case "sent_for_admin":
      return "Sent for Admin";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return typeof value === "string" && value.trim()
        ? value.trim()
        : "Unknown";
  }
}
