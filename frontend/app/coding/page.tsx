import { Code2 } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function CodingPage() {
  return (
    <WorkspacePage
      title="Coding"
      icon={<Code2 className="size-6" aria-hidden />}
    />
  );
}
