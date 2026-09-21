import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Política de Privacidad | Gestión Inmueble Naranjo",
  description: "Política de tratamiento de datos personales y seguridad de Inmobiliaria Naranjo LTDA.",
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

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-2 border-b pb-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <LockKeyhole className="h-4 w-4" />
            Habeas Data · Seguridad de la Información
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Política de Privacidad y Tratamiento de Datos Personales
          </CardTitle>
          <CardDescription>
            Inmobiliaria Naranjo LTDA. · Conforme a la Ley 1581 de 2012, Decreto 1377 de 2013 y normas concordantes de Colombia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Identificación del Responsable del Tratamiento</h2>
            <p>
              <strong>Inmobiliaria Naranjo LTDA.</strong>, sociedad comercial legalmente constituida bajo las leyes de la
              República de Colombia, con domicilio principal en el territorio nacional, actúa como Responsable del
              Tratamiento de los datos personales almacenados, procesados y custodiados a través de este aplicativo
              corporativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Categorías de Datos Objeto de Tratamiento</h2>
            <p>
              El aplicativo gestiona dos categorías diferenciadas de información conforme a su naturaleza y finalidad:
            </p>
            <div className="space-y-3 pt-1">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                  A. Datos de Clientes (Propietarios y Arrendatarios)
                </h3>
                <p className="text-xs">
                  Nombres completos, números de documento de identidad (C.C., NIT), direcciones de inmuebles, números
                  telefónicos, correos electrónicos, datos comerciales de cánones y vigencias contractuales. Estos datos se
                  recaban exclusivamente en el marco de la relación comercial o mandato inmobiliario.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                  B. Datos de Colaboradores y Telemetría Operativa (Usuarios del Sistema)
                </h3>
                <p className="text-xs">
                  Nombres, nombres de usuario institucionales, rol asignado, registros de autenticación (inicios y cierres
                  de sesión, intentos fallidos con motivo), dirección IP real de conexión, geolocalización aproximada a
                  nivel ciudad/país (suministrada por la infraestructura de red perimetral), tipo de dispositivo, navegador,
                  sistema operativo, ruta o pantalla activa y registros de auditoría de transacciones.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Finalidades Legítimas del Tratamiento</h2>
            <p>
              De conformidad con el Principio de Libertad y Finalidad (Ley 1581 de 2012, Art. 4), los datos personales son
              utilizados únicamente para:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Ejecución, seguimiento y administración de contratos de arrendamiento, consignación y administración
                inmobiliaria.
              </li>
              <li>
                Gestión operativa de cobranza, reportes contables, facturación y atención oportuna de peticiones.
              </li>
              <li>
                Coordinación y trazabilidad de visitas a inmuebles, mantenimientos locativos e inspecciones de inventario.
              </li>
              <li>
                Seguridad informática, prevención de fraudes, control de accesos no autorizados y auditoría inmutable de
                actividades administrativas y operativas de los colaboradores.
              </li>
              <li>
                Monitoreo en vivo de presencia del equipo para optimización y balanceo de carga de trabajo en el panel de
                administración.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              4. Principio de Minimización y Reglas Especiales de Auditoría
            </h2>
            <p>
              Para garantizar la confidencialidad absoluta y evitar la sobreexposición de datos sensibles en bitácoras de
              sistema, la plataforma aplica políticas automáticas de sanitización de auditoría:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Cero almacenamiento de secretos:</strong> En ningún caso se registran contraseñas, hashes en claro,
                tokens, cookies, claves ni contenidos literales de notas privadas u observaciones.
              </li>
              <li>
                <strong>Enmascaramiento de datos personales en diffs:</strong> Los registros de auditoría que reflejan
                ediciones en el catálogo protegen automáticamente documentos de identidad, números telefónicos y correos
                de clientes mediante la marca <code>[DATO_PERSONAL_RESERVADO]</code>, preservando la constancia del cambio
                sin duplicar datos privados en las bitácoras.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Medidas de Seguridad de la Información</h2>
            <p>
              En cumplimiento del Principio de Seguridad (Art. 4, literal g, Ley 1581 de 2012), Inmobiliaria Naranjo LTDA.
              adopta medidas técnicas de vanguardia:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Cifrado y Hashes Criptográficos:</strong> Todas las conexiones emplean canales seguros cifrados
                TLS/HTTPS. Las contraseñas de los usuarios se almacenan con algoritmos de derivación irreversibles
                (bcrypt con sal única).
              </li>
              <li>
                <strong>Inmutabilidad en 3 Capas:</strong> Las bitácoras de auditoría de actividad y accesos son de estricta
                adición (append-only), blindadas a nivel de aplicación, ORM y mediante triggers en la base de datos
                PostgreSQL para impedir su manipulación, modificación o borrado accidental o deliberado.
              </li>
              <li>
                <strong>Cortafuegos Perimetral (Edge WAF):</strong> Filtrado perimetral contra bots maliciosos,
                geobloqueo exclusivo para conexiones en Colombia y limitador de tasa de peticiones (rate limiting) en los
                puntos de autenticación.
              </li>
              <li>
                <strong>Control de Acceso Basado en Roles (RBAC):</strong> Separación estricta de privilegios entre
                Administradores, Asesores Comerciales y Personal de Mantenimiento.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Política de Retención y Conservación</h2>
            <p>
              Los datos se conservan únicamente durante el tiempo estrictamente necesario y proporcional a las finalidades
              establecidas:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Datos contractuales y de inmuebles:</strong> Durante la vigencia de la relación contractual y los
                plazos de prescripción legal civil y tributaria colombiana.
              </li>
              <li>
                <strong>Bitácoras de auditoría y registros de acceso:</strong> Conservación reglamentaria de doce (12)
                meses por defecto, tras lo cual se realiza depuración automática por lotes mediante procesos programados
                autorizados.
              </li>
              <li>
                <strong>Señales de presencia en vivo:</strong> Son transitorias y se actualizan por sesión; registros
                inactivos por más de veinticuatro (24) horas son eliminados de la base de datos.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Derechos de los Titulares (Habeas Data)</h2>
            <p>
              Conforme al Artículo 8 de la Ley 1581 de 2012, todo titular tiene derecho a conocer, actualizar y rectificar
              sus datos personales frente a Inmobiliaria Naranjo LTDA., solicitar prueba de la autorización otorgada, ser
              informado sobre el uso de sus datos, y revocar la autorización o solicitar la supresión de la información
              cuando no medie un deber legal o contractual de permanencia.
            </p>
          </section>

          <section className="space-y-2 border-t pt-4">
            <h2 className="text-base font-semibold text-foreground">8. Procedimiento y Canales de Atención</h2>
            <p>
              Para ejercer los derechos de Habeas Data o presentar consultas y reclamos relativos a datos personales, los
              titulares pueden dirigir su solicitud a la administración de Inmobiliaria Naranjo LTDA. a través de los
              canales oficiales institucionales o mediante comunicación escrita formal. Las peticiones serán atendidas
              dentro de los plazos estipulados en los Artículos 14 y 15 de la Ley 1581 de 2012.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
