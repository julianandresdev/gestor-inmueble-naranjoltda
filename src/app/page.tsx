import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "MANTENIMIENTO") redirect("/mantenimiento");
    redirect("/dashboard");
  }
  redirect("/login");
}