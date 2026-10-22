import { FileText } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function DocumentsPage() {
  return (
    <WorkspacePage
      title="Documents"
      icon={<FileText className="size-6" aria-hidden />}
    />
  );
}
