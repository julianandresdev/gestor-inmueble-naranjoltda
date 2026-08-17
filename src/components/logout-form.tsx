"use client";

import { useActionState } from "react";
import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export function LogoutForm() {
  const [, formAction, pending] = useActionState(logout, undefined);
  return (
    <form action={formAction}>
      <Button type="submit" disabled={pending} variant="outline">
        {pending && <Spinner className="mr-2" />}
        {pending ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
    </form>
  );
}