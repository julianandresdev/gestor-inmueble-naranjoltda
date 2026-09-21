import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { auth } from "@/auth";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";

export const metadata: Metadata = {
  title: "Gestion Inmueble Naranjo",
  description: "Sistema interno de gestión de inmuebles, seguimiento y tareas.",
};

const themeScript = `(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PresenceHeartbeat isLoggedIn={Boolean(session?.user)} />
        <AppNav />
        <div className="flex-1">{children}</div>
        <footer className="border-t py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Inmobiliaria Naranjo LTDA."
                width={20}
                height={20}
                className="h-5 w-auto"
              />
              <span>Gestion Inmueble Naranjo</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terminos" className="hover:underline">
                Términos y condiciones
              </Link>
              <Link href="/privacidad" className="hover:underline">
                Política de privacidad
              </Link>
            </div>
          </div>
        </footer>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
