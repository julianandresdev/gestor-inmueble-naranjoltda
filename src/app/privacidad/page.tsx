import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Política de Privacidad | Gestión Inmueble Naranjo",
  description: "Política de tratamiento de datos personales de Inmobiliaria Naranjo LTDA.",
};

export default function PrivacidadPage() {
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
          <CardTitle className="text-2xl font-bold">
            Política de Privacidad y Tratamiento de Datos Personales
          </CardTitle>
          <CardDescription>
            Inmobiliaria Naranjo LTDA. · Conforme a la Ley 1581 de 2012 y Decreto 1377 de 2013 (Colombia)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Responsable del Tratamiento</h2>
            <p>
              <strong>Inmobiliaria Naranjo LTDA.</strong>, sociedad legalmente constituida en la República de
              Colombia, actúa como Responsable del Tratamiento de los datos personales almacenados y gestionados a través
              de este aplicativo interno.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Finalidad de la Recolección de Datos</h2>
            <p>
              Los datos personales recolectados y administrados en esta plataforma (tanto de propietarios, arrendatarios,
              proveedores como de colaboradores) son tratados exclusivamente para los siguientes fines legítimos:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Elaboración, ejecución, seguimiento y control de contratos de arrendamiento y consignación inmobiliaria.</li>
              <li>Comunicación oportuna con propietarios y arrendatarios para trámites administrativos, pagos y novedades.</li>
              <li>Coordinación de solicitudes de mantenimiento, visitas a inmuebles e inspecciones.</li>
              <li>Gestión contable, financiera y de facturación.</li>
              <li>Control de acceso, auditoría de seguridad y trazabilidad de operaciones internas.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Derechos de los Titulares (Habeas Data)</h2>
            <p>
              De conformidad con el Artículo 8 de la Ley 1581 de 2012, los titulares de los datos personales tienen derecho a:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Conocer, actualizar y rectificar sus datos personales frente a la inmobiliaria.</li>
              <li>Solicitar prueba de la autorización otorgada para el tratamiento de sus datos.</li>
              <li>Ser informados sobre el uso que se ha dado a sus datos personales.</li>
              <li>Presentar ante la Superintendencia de Industria y Comercio (SIC) quejas por infracciones a la ley.</li>
              <li>Revocar la autorización o solicitar la supresión del dato cuando proceda legalmente.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Medidas de Seguridad y Protección</h2>
            <p>
              Inmobiliaria Naranjo LTDA. implementa rigurosas medidas técnicas, humanas y administrativas para
              garantizar la seguridad de la información, previniendo su adulteración, pérdida, consulta, uso o acceso no
              autorizado o fraudulento:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Controles de autenticación con contraseñas seguras y control de acceso basado en roles (RBAC).</li>
              <li>Protección perimetral mediante Web Application Firewall (WAF), rate-limiting y restricción geográfica a Colombia.</li>
              <li>Cifrado de datos en tránsito mediante protocolos HTTPS / TLS.</li>
              <li>Registro de auditoría inmutable de actividades administrativas.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Canales de Atención</h2>
            <p>
              Para consultas, solicitudes de actualización de datos personales o el ejercicio de derechos de Habeas Data,
              los titulares pueden comunicarse con la administración de Inmobiliaria Naranjo LTDA. a través de los
              canales institucionales de atención al cliente.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
