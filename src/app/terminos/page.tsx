import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-2 border-b pb-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" />
            Normativa y Políticas de Uso Corporativo
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Términos y Condiciones de Uso del Sistema
          </CardTitle>
          <CardDescription>
            Inmobiliaria Naranjo LTDA. · Plataforma interna de gestión inmobiliaria · Actualizado: Septiembre 2026
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Objeto y Ámbito de Aplicación</h2>
            <p>
              El presente aplicativo <strong>Gestión Inmueble Naranjo</strong> es un sistema de información de uso{" "}
              <strong>exclusivo e interno</strong>, desarrollado para los colaboradores, asesores comerciales y
              personal administrativo debidamente autorizado de <strong>Inmobiliaria Naranjo LTDA.</strong>
            </p>
            <p>
              Su finalidad exclusiva es la administración operativa y documental de inmuebles, contratos de
              arrendamiento, consignaciones, seguimiento de tareas internas, gestión de mantenimientos y canalización de
              soporte técnico. Queda terminantemente prohibido su uso para fines particulares, comerciales no
              autorizados o ajenos a la actividad empresarial de la compañía.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Custodia de Credenciales y Control de Autenticación</h2>
            <p>
              El acceso a la plataforma se efectúa mediante credenciales individuales, personales e intransferibles
              (nombre de usuario y contraseña cifrada). Cada colaborador es único y directo responsable de la custodia de
              sus claves y de toda operación efectuada desde su cuenta.
            </p>
            <p>
              En cumplimiento de los estándares de seguridad de la información y la Ley 1273 de 2009 de Colombia (delitos
              informáticos):
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Está expresamente prohibido compartir credenciales entre colaboradores o permitir el uso de la sesión a
                terceros.
              </li>
              <li>
                El sistema monitorea y registra cada intento de inicio de sesión (exitoso o fallido), registrando la
                dirección IP de origen, el tipo de dispositivo, navegador, sistema operativo y marca temporal.
              </li>
              <li>
                Se aplicarán bloqueos y restricciones automáticas por límite de intentos fallidos reiterados
                (rate-limiting) para prevenir intrusiones o ataques de fuerza bruta.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Confidencialidad y Secreto Profesional</h2>
            <p>
              La totalidad de los datos alojados en este aplicativo —incluyendo información de identificación, teléfonos,
              correos, cánones de arrendamiento, cuentas bancarias, avalúos y contratos de propietarios y arrendatarios—
              constituye <strong>secreto comercial y profesional</strong> de Inmobiliaria Naranjo LTDA., amparado por la
              Ley Estatutaria 1581 de 2012 de Protección de Datos Personales (Habeas Data).
            </p>
            <p>
              El usuario se compromete formalmente a mantener estricta reserva y a no extraer, fotografiar, descargar,
              divulgar ni transferir información a dispositivos o soportes ajenos a los provistos por la empresa para el
              ejercicio de sus funciones.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Monitoreo Operativo, Presencia en Vivo y Auditoría Inmutable</h2>
            <p>
              Para asegurar la continuidad del servicio, la trazabilidad corporativa y la protección contra fraudes o
              alteraciones no autorizadas, el usuario reconoce y acepta que:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Presencia en vivo:</strong> Mientras el aplicativo permanezca abierto en una pestaña activa, el
                navegador reporta una señal periódica de presencia técnica (latido cada 60 segundos), registrando la ruta
                o módulo actual y estado de conectividad para visualización y asignación operativa en el panel
                administrativo.
              </li>
              <li>
                <strong>Auditoría inmutable de transacciones:</strong> Toda acción de creación, modificación,
                archivado, restauración, cambio de estado de tareas, emisión de notas o exportación queda registrada con
                identificador de usuario, dirección IP, dispositivo y el resumen de campos modificados.
              </li>
              <li>
                <strong>Inmutabilidad técnica:</strong> Los registros de auditoría y accesos son de estricta inserción
                continua (append-only) protegidos en tres capas (aplicación, ORM y triggers de base de datos PostgreSQL),
                impidiendo cualquier modificación o borrado manual.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Seguridad Perimetral y Reglas de Conexión</h2>
            <p>
              La infraestructura tecnológica opera bajo políticas de protección perimetral mediante cortafuegos (Edge
              WAF):
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Georrestricción exclusiva:</strong> El acceso al sistema está restringido al territorio de la
                República de Colombia. Conexiones desde el exterior o mediante túneles VPN no autorizados podrán ser
                bloqueadas preventivamente.
              </li>
              <li>
                <strong>Horarios de acceso:</strong> El acceso a la plataforma en horarios no habituales o fines de semana
                es registrado como evento relevante de supervisión para detección de anomalías de seguridad.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Política de Retención y Depuración Programada</h2>
            <p>
              Los registros de auditoría operativa y eventos de autenticación se conservan por un periodo configurable de
              retención reglamentaria (12 meses por defecto), tras el cual son depurados o consolidados mediante tareas
              programadas automáticas y controladas. Las sesiones de presencia sin actividad durante más de 24 horas se
              depuran automáticamente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Régimen de Responsabilidad y Sanciones</h2>
            <p>
              El uso indebido de este aplicativo, la alteración no autorizada de datos, la suplantación de identidad o la
              filtración de información confidencial dará lugar a las sanciones disciplinarias y contractuales previstas
              en el Reglamento Interno de Trabajo, sin perjuicio de las acciones civiles y denuncias penales contempladas
              en la Ley 1273 de 2009.
            </p>
          </section>

          <section className="space-y-2 border-t pt-4">
            <h2 className="text-base font-semibold text-foreground">8. Soporte y Administración</h2>
            <p>
              En caso de incidencias de conectividad, bloqueo de claves, anomalías en los datos o dudas sobre estas
              disposiciones, comuníquese con el Administrador del Sistema a través del módulo interno de Soporte.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
