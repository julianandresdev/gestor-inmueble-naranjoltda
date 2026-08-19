import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Image from "next/image";
import { Toaster } from "sonner";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Gestion Inmobiliaria Naranjo",
  description: "Sistema interno de gestión de inmuebles, seguimiento y tareas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppNav />
        <div className="flex-1">{children}</div>
        <footer className="border-t py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 text-xs text-muted-foreground">
            <Image
              src="/logo.png"
              alt="Naranjo Ltda."
              width={20}
              height={20}
              className="h-5 w-auto"
            />
            <span>Gestion Inmobiliaria Naranjo</span>
          </div>
        </footer>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
