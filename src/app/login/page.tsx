import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/inicio");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/logo.png"
          alt="Inmobiliaria Naranjo LTDA."
          width={96}
          height={96}
          className="h-24 w-auto"
          priority
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestion Inmueble Naranjo
        </h1>
        <p className="text-sm text-muted-foreground">Inmobiliaria Naranjo LTDA.</p>
      </div>
      <LoginForm />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Link href="/terminos" className="hover:underline">
          Términos y condiciones
        </Link>
        <span>·</span>
        <Link href="/privacidad" className="hover:underline">
          Política de privacidad
        </Link>
      </div>
    </main>
  );
}