import { HeaderSkeleton, CardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <HeaderSkeleton />
      <CardSkeleton lines={6} />
    </main>
  );
}
