export default function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">Loading account setup</p>
          <p className="text-xs text-slate-500">Preparing your FlowPilot registration flow</p>
        </div>
      </div>
    </div>
  );
}
