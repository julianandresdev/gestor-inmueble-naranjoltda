"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import type { ReactNode } from "react";

export function InmuebleTableRow({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/60 transition-colors"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a") || target.closest("button")) return;
        router.push(`/inmuebles/${id}`);
      }}
    >
      {children}
    </TableRow>
  );
}
