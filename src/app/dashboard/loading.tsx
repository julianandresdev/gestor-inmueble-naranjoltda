import { HeaderSkeleton, KpiSkeleton, CardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <HeaderSkeleton />
      <KpiSkeleton cards={6} />
      <CardSkeleton lines={6} />
      <CardSkeleton lines={5} />
    </main>
  );
}
