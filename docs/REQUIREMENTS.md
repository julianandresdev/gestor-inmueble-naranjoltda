# Sistema de Gestión Inmobiliaria

## 1. Contexto

Actualmente la inmobiliaria gestiona sus inmuebles y arriendos mediante un archivo de Excel. La información contiene datos del inmueble, arrendatarios, propietarios y observaciones, pero el sistema actual presenta problemas de seguimiento, organización, búsqueda y control de la información.

Algunos problemas principales son:

- Confusión o errores al trabajar con los identificadores de los inmuebles.
- Dificultad para buscar y filtrar información.
- Las notas de seguimiento pueden no registrarse o perderse.
- No existe un historial claro de las acciones realizadas.
- No hay un sistema centralizado de tareas pendientes.
- Es difícil saber qué tareas requieren atención y cuáles están siendo realizadas.
- No existe un control adecuado de usuarios y acceso.

El objetivo es reemplazar progresivamente este manejo basado en Excel por una aplicación web interna y colaborativa.

---

# 2. Objetivo

Desarrollar una aplicación web para la gestión de inmuebles, información relacionada, seguimiento y tareas de una inmobiliaria.

El sistema debe permitir que los usuarios trabajen sobre una base de información centralizada, manteniendo trazabilidad de las acciones y evitando la eliminación permanente de datos.

---

# 3. Usuarios y roles

Existirán inicialmente dos roles:

## Administrador

Tiene acceso completo al sistema.

Puede:

- Gestionar usuarios.
- Crear, editar, activar y desactivar asesores.
- Ver, crear y editar todos los inmuebles.
- Archivar y restaurar inmuebles.
- Ver y crear notas.
- Ver y gestionar todas las tareas.
- Intervenir en tareas reclamadas por otros usuarios.
- Acceder a información y métricas generales.

## Asesor

Todos los asesores trabajan sobre la misma información.

Pueden:

- Ver todos los inmuebles activos.
- Buscar y filtrar inmuebles.
- Crear y editar cualquier inmueble.
- Ver y crear notas en cualquier inmueble.
- Ver todas las tareas.
- Crear tareas.
- Reclamar tareas sin asignar.
- Liberar tareas que hayan reclamado.
- Completar tareas que estén realizando.

No existe asignación de inmuebles a asesores.

---

# 4. Inmuebles

El inmueble es la entidad principal del sistema.

Su identificador único es:

## `No. Inm`

Reglas:

- Es único para cada inmueble.
- Se conserva desde el Excel actual.
- Identifica permanentemente al inmueble.
- No puede repetirse.
- No debe modificarse desde la edición normal.
- Un inmueble puede cambiar de arrendatario sin cambiar su `No. Inm`.

Los datos iniciales de cada inmueble son:

- No. Inm
- Barrio
- Ciudad
- Tipo Inmueble
- Destinación
- Dirección
- Doc. Arrendatario
- Arrendatario
- CelArre1
- EmailArre
- Doc. Propietario
- Propietario
- EmailPro
- CelPro1
- Vigencia Contrato
- NomAdmin
- Observaciones

Consideraciones:

- `Destinación`: inicialmente puede ser Vivienda o Comercio.
- `Vigencia Contrato`: se manejará como texto libre.
- `NomAdmin`: nombre de la administración asociada, por ejemplo, un conjunto residencial o unidad residencial.
- Solo se almacena la información actual del arrendatario y propietario; no es necesario un historial de arrendatarios para el MVP.

---

# 5. Notas y seguimiento

Cada inmueble puede tener múltiples notas de seguimiento.

Las notas deben:

- Estar asociadas a un inmueble.
- Tener contenido.
- Registrar automáticamente su autor.
- Registrar automáticamente fecha y hora.
- Mostrarse como historial cronológico.

Las notas son diferentes del campo `Observaciones`.

- **Observaciones:** información general actual del inmueble.
- **Notas:** historial de seguimiento realizado por los usuarios.

Todos los usuarios pueden crear notas en cualquier inmueble.

---

# 6. Tareas

El sistema tendrá un sistema de tareas colaborativo.

Las tareas pueden:

- Estar asociadas a un inmueble.
- Ser tareas generales sin un inmueble asociado.

Cada tarea tendrá:

- Título.
- Descripción opcional.
- Inmueble relacionado opcional.
- Fecha límite opcional.
- Importante: sí/no.
- Urgente: sí/no.
- Estado.
- Usuario que la creó.
- Fecha de creación.
- Responsable actual, si existe.

## Estados

- Sin asignar.
- En progreso.
- Completada.
- Cancelada.
- Archivada.

## Flujo principal

Una tarea nueva comienza como:

`Sin asignar`

Cualquier usuario puede reclamarla. Al hacerlo:

- El responsable pasa a ser ese usuario.
- El estado pasa a `En progreso`.

El responsable puede:

- Liberarla, dejándola nuevamente sin asignar.
- Marcarla como completada.

El administrador puede intervenir en cualquier tarea, incluso si fue reclamada por otro usuario.

El sistema debe evitar que dos usuarios reclamen simultáneamente la misma tarea.

Una tarea puede considerarse vencida si tiene fecha límite y esta ya pasó, siempre que no esté completada o cancelada.

---

# 7. Búsqueda y filtros

Los inmuebles deben poder buscarse, como mínimo, por:

- No. Inm.
- Dirección.
- Barrio.
- Ciudad.
- Arrendatario.
- Documento del arrendatario.
- Teléfono del arrendatario.
- Propietario.
- Documento del propietario.
- Teléfono del propietario.

También deben existir filtros por:

- Ciudad.
- Barrio.
- Tipo de inmueble.
- Destinación.
- Estado.

Las tareas deben poder filtrarse, como mínimo, por:

- Estado.
- Responsable.
- Urgente.
- Importante.
- Vencidas.
- Con inmueble asociado / tareas generales.

---

# 8. Archivado y conservación de datos

El sistema no debe eliminar información permanentemente desde la aplicación.

## Inmuebles

Pueden estar:

- Activos.
- Archivados.

Los inmuebles archivados no aparecen por defecto en la lista principal y pueden ser restaurados por el administrador.

## Usuarios

Pueden estar:

- Activos.
- Inactivos.

Un usuario inactivo no puede iniciar sesión, pero su historial y acciones permanecen registrados.

## Tareas

Las tareas no deben eliminarse permanentemente. Pueden completarse, cancelarse o archivarse según corresponda.

---

# 9. Trazabilidad y actividad

El sistema debe mantener trazabilidad básica de las acciones importantes.

Como mínimo, debe permitir conocer:

- Quién creó un inmueble.
- Cuándo fue creado.
- Quién realizó la última modificación.
- Cuándo fue modificado.
- Autor y fecha de cada nota.
- Quién creó una tarea.
- Quién reclamó, liberó o completó una tarea.
- Acciones importantes de archivado y restauración.

---

# 10. Pantallas principales

El MVP tendrá inicialmente las siguientes pantallas:

1. **Login**
   - Inicio de sesión mediante usuario y contraseña.

2. **Dashboard**
   - Resumen general.
   - Métricas de inmuebles y tareas.
   - Tareas urgentes o vencidas.
   - Actividad reciente.

3. **Lista de inmuebles**
   - Búsqueda.
   - Filtros.
   - Acceso al detalle.
   - Creación de nuevos inmuebles.

4. **Formulario de inmueble**
   - Crear inmueble.
   - Editar inmueble.

5. **Detalle del inmueble**
   - Información.
   - Notas.
   - Tareas relacionadas.
   - Actividad.

6. **Lista de tareas**
   - Todas las tareas.
   - Búsqueda y filtros.
   - Acceso al detalle.

7. **Formulario de tarea**
   - Creación de tareas generales o asociadas a un inmueble.

8. **Detalle de tarea**
   - Información completa.
   - Reclamar.
   - Liberar.
   - Completar.
   - Acciones administrativas según permisos.

9. **Gestión de usuarios**
   - Solo administrador.
   - Crear, editar, activar y desactivar usuarios.

10. **Inmuebles archivados**
    - Solo administrador.
    - Consultar y restaurar.

---

# 11. Reglas importantes

- Todos los asesores pueden ver todos los inmuebles.
- Todos los asesores pueden editar cualquier inmueble activo.
- No existe asignación de inmuebles a usuarios.
- `No. Inm` es el identificador único del inmueble.
- `No. Inm` no debe duplicarse ni modificarse normalmente.
- Los inmuebles pueden cambiar de arrendatario.
- No se requiere historial de arrendatarios para el MVP.
- Las notas son un historial de seguimiento.
- Todos pueden ver las tareas.
- Las tareas nuevas comienzan sin asignar.
- Cualquier usuario puede reclamar una tarea disponible.
- Una tarea reclamada no puede ser reclamada por otra persona.
- El administrador puede intervenir en cualquier tarea.
- Nada debe eliminarse permanentemente desde la aplicación.
- Debe mantenerse trazabilidad de las acciones importantes.

---

# 12. Desarrollo por fases

El proyecto se desarrollará progresivamente. No se debe intentar implementar todo el sistema en una sola fase.

## Fase 0 — Base del proyecto

- Inicialización del proyecto.
- Configuración del stack tecnológico.
- Configuración de la base de datos.
- Estructura base del proyecto.
- Configuración de variables de entorno.

## Fase 1 — Autenticación y usuarios

- Inicio de sesión.
- Manejo de sesión.
- Roles.
- Protección de rutas.
- Gestión básica de usuarios por el administrador.

## Fase 2 — Gestión de inmuebles

- Modelo de inmueble.
- Crear inmuebles.
- Listar inmuebles.
- Buscar.
- Filtrar.
- Ver detalle.
- Editar inmuebles.

## Fase 3 — Seguimiento

- Notas asociadas a inmuebles.
- Autor, fecha y hora.
- Historial de notas.
- Actividad básica de inmuebles.

## Fase 4 — Tareas

- Crear tareas.
- Tareas generales y asociadas a inmuebles.
- Listar y filtrar tareas.
- Reclamar tareas.
- Liberar tareas.
- Completar tareas.
- Prioridades.
- Fechas límite y detección de vencimiento.
- Permisos de intervención del administrador.

## Fase 5 — Dashboard y archivado

- Dashboard.
- Métricas.
- Tareas urgentes y vencidas.
- Actividad reciente.
- Archivar inmuebles.
- Restaurar inmuebles.

## Fase 6 — Revisión y mejoras

- Auditoría y trazabilidad restante.
- Validaciones.
- Manejo de errores.
- Revisión de permisos.
- Pruebas.
- Correcciones.
- Mejoras generales de experiencia de usuario.

---

# 13. Forma de trabajo

El desarrollo se realizará fase por fase.

Para cada fase:

1. Se entrega al agente de código el contexto de este documento.
2. Se entrega la instrucción específica de la fase actual.
3. El agente implementa únicamente lo solicitado para esa fase.
4. Se prueba manualmente el resultado.
5. Se corrigen errores antes de continuar.
6. Solo después se inicia la siguiente fase.

El objetivo es avanzar de forma incremental, manteniendo el proyecto funcional durante todo el desarrollo.