import { HeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={8} />
    </main>
  );
}
