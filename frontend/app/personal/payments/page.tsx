import { CreditCard } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function PaymentsPage() {
  return (
    <WorkspacePage
      title="Payments"
      icon={<CreditCard className="size-6" aria-hidden />}
    />
  );
}
