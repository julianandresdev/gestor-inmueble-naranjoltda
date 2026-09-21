export default function AdminPanelLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-muted" />
          <div className="h-4 w-96 rounded-md bg-muted/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-md bg-muted" />
          <div className="h-9 w-24 rounded-md bg-muted" />
          <div className="h-9 w-24 rounded-md bg-muted" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted/80" />
            <div className="h-3 w-32 rounded bg-muted/50" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-xl border bg-card p-6 space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-64 w-full rounded bg-muted/40" />
        </div>
        <div className="h-96 rounded-xl border bg-card p-6 space-y-4">
          <div className="h-6 w-36 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-muted/40" />
            ))}
          </div>
        </div>
      </div>

      {/* Second Row Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-xl border bg-card p-6 space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-56 w-full rounded bg-muted/40" />
        </div>
        <div className="h-80 rounded-xl border bg-card p-6 space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-56 w-full rounded bg-muted/40" />
        </div>
      </div>
    </main>
  );
}
