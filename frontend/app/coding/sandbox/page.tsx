import { FlaskConical } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function SandboxPage() {
  return (
    <WorkspacePage
      title="Sandbox"
      icon={<FlaskConical className="size-6" aria-hidden />}
    />
  );
}
