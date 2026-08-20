import { CardSkeleton, HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <HeaderSkeleton />
      <CardSkeleton lines={4} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
    </main>
  );
}
