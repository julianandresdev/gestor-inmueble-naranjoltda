import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Términos y Condiciones | Gestión Inmueble Naranjo",
  description: "Términos y condiciones de uso del sistema interno de Inmobiliaria Naranjo LTDA.",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/inicio" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Términos y Condiciones de Uso</CardTitle>
          <CardDescription>
            Inmobiliaria Naranjo LTDA. · Última actualización: Septiembre 2026
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Objeto y Ámbito de Aplicación</h2>
            <p>
              El presente sistema es una plataforma tecnológica de uso <strong>exclusivamente interno</strong>,
              destinada a los colaboradores, asesores y personal administrativo debidamente autorizado de{" "}
              <strong>Inmobiliaria Naranjo LTDA.</strong> Su finalidad es la gestión operativa de inmuebles,
              contratos de arrendamiento, asignación de tareas internas, gestión de mantenimiento y soporte técnico.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Custodia de Credenciales y Acceso</h2>
            <p>
              El acceso a la plataforma se realiza mediante credenciales individuales e intransferibles. Cada
              usuario es responsable exclusivo de la confidencialidad de su contraseña y de cualquier acción ejecutada
              bajo su sesión.
            </p>
            <p>
              Queda expresamente prohibido ceder, compartir o divulgar credenciales a terceros, así como intentar acceder
              a módulos o registros que no correspondan al rol asignado (Ley 1273 de 2009 de la República de Colombia
              sobre la protección de la información y de los datos informáticos).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Confidencialidad de la Información</h2>
            <p>
              Toda la información almacenada en este aplicativo —incluyendo pero no limitándose a documentos de identidad,
              teléfonos, correos electrónicos, datos comerciales y financieros de arrendatarios y propietarios— constituye
              información confidencial sujeta a secreto profesional y a las disposiciones de la Ley Estatutaria 1581 de 2012
              (Habeas Data).
            </p>
            <p>
              El usuario se compromete a no reproducir, exportar, divulgar ni utilizar la información para fines ajenos al
              cumplimiento de sus funciones laborales dentro de la inmobiliaria.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Registro y Auditoría de Actividades</h2>
            <p>
              Para garantizar la integridad y trazabilidad operativa, el sistema registra de forma automática las acciones
              relevantes realizadas por cada usuario (creación, edición, archivado de inmuebles, cambios de contraseña,
              estados de tareas y tickets). Estos registros son de uso reservado para auditoría interna y seguridad.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Disponibilidad y Seguridad</h2>
            <p>
              La plataforma cuenta con controles de seguridad perimetral (firewall, rate-limiting y geo-restricción a
              territorio colombiano). La empresa se reserva el derecho de suspender temporal o definitivamente el acceso
              a cualquier usuario en caso de detectarse anomalías de seguridad o incumplimiento de las políticas internas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Contacto y Consultas</h2>
            <p>
              Para dudas sobre estos términos, restablecimiento de accesos o reporte de incidentes, comunícate con la
              administración de Inmobiliaria Naranjo LTDA. a través del módulo interno de Soporte.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
