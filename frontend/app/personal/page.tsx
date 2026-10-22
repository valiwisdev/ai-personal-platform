import { UserRound } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function PersonalPage() {
  return (
    <WorkspacePage
      title="Personal"
      icon={<UserRound className="size-6" aria-hidden />}
    />
  );
}
