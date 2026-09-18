import { WorkflowExecution } from "@/types/execution";
import { ExecutionCard } from "./ExecutionCard";
import { Activity } from "lucide-react";

interface ExecutionListProps {
  executions: WorkflowExecution[];
}

export function ExecutionList({ executions }: ExecutionListProps) {
  if (executions.length === 0) {
    return (
      <div className="flex h-[40vh] items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-dark-900/60 p-8 text-center backdrop-blur-sm">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950/60 text-blue-400 mx-auto mb-3 border border-blue-500/30">
            <Activity className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-200">No workflow executions yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Execute a workflow from the builder to see live runs and logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {executions.map((execution) => (
        <ExecutionCard key={execution.id} execution={execution} />
      ))}
    </div>
  );
}
