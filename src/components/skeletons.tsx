import { Skeleton } from "@/components/skeleton";

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export function KpiSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}
