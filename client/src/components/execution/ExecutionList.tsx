import { WorkflowExecution } from "@/types/execution";
import { ExecutionCard } from "./ExecutionCard";

interface ExecutionListProps {
  executions: WorkflowExecution[];
}

export function ExecutionList({ executions }: ExecutionListProps) {
  if (executions.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No workflow executions yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Execute a workflow to see its history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {executions.map((execution) => (
        <ExecutionCard key={execution.id} execution={execution} />
      ))}
    </div>
  );
}
