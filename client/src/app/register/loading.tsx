export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400">Loading FlowPilot...</span>
      </div>
    </div>
  );
}
