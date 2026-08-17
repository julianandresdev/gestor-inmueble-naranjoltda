import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/inicio");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/logo.png"
          alt="Naranjo Ltda."
          width={96}
          height={96}
          className="h-24 w-auto"
          priority
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestion Inmobiliaria Naranjo
        </h1>
        <p className="text-sm text-muted-foreground">Naranjo Ltda.</p>
      </div>
      <LoginForm />
    </main>
  );
}