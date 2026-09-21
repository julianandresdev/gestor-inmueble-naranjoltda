import "server-only";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import type { TicketPrioridad, AccesoTipo } from "@/generated/prisma/client";

export type PeriodoFiltro = "hoy" | "7d" | "30d";

export type AdminPanelData = {
  periodo: PeriodoFiltro;
  fechaInicio: string;
  generadoEn: string;
  alertas: {
    tareasVencidas: Array<{
      id: string;
      titulo: string;
      fechaLimite: Date | null;
      tipo: string;
      asignadoA: string | null;
      diasVencida: number;
    }>;
    mantenimientosEstancados: Array<{
      id: string;
      titulo: string;
      estado: string;
      diasInactivo: number;
      asignadoA: string | null;
    }>;
    intentosFallidosSospechosos: Array<{
      identificador: string;
      tipo: "IP" | "USUARIO";
      totalFallos: number;
      ultimoFallo: Date;
      ciudad: string | null;
      pais: string | null;
    }>;
  };
  kpis: {
    inmuebles: {
      activos: number;
      archivados: number;
      total: number;
      nuevosEnPeriodo: number;
    };
    tareas: {
      pendientes: number;
      vencidas: number;
      completadasEnPeriodo: number;
      sinAsignar: number;
    };
    mantenimiento: {
      abiertos: number;
      sinAsignar: number;
      enProgreso: number;
      completadosEnPeriodo: number;
    };
    soporte: {
      abiertos: number;
      urgentesAbiertos: number;
      enProgreso: number;
      resueltosEnPeriodo: number;
    };
    equipo: {
      conectadosAhora: number;
      totalActivos: number;
    };
  };
  equipo: {
    conectados: Array<{
      id: string;
      userId: string;
      nombre: string;
      username: string;
      rol: string;
      dispositivo: string;
      navegador: string;
      sistemaOperativo: string;
      ip: string;
      rutaActual: string;
      ultimaActividad: Date;
      minutosInactivo: number;
    }>;
    resumenUsuarios: Array<{
      userId: string;
      nombre: string;
      username: string;
      rol: string;
      totalAcciones: number;
      ultimaAccion: Date | null;
      desglose: Record<string, number>;
    }>;
    actividadPorDia: Array<{
      fecha: string;
      total: number;
    }>;
    actividadPorModulo: Array<{
      modulo: string;
      total: number;
    }>;
  };
  seguridad: {
    resumenAccesos: {
      exitosos: number;
      fallidos: number;
      logouts: number;
    };
    intentosFallidosRecientes: Array<{
      id: string;
      username: string;
      ip: string;
      dispositivo: string;
      navegador: string;
      sistemaOperativo: string;
      ciudad: string | null;
      pais: string | null;
      motivo: string | null;
      fecha: Date;
    }>;
    dispositivos: Array<{
      tipo: string;
      total: number;
    }>;
    navegadores: Array<{
      nombre: string;
      total: number;
    }>;
    accesosFueraDeHorario: Array<{
      id: string;
      username: string;
      ip: string;
      dispositivo: string;
      fecha: Date;
      tipo: AccesoTipo;
    }>;
    eventosSensibles: Array<{
      id: string;
      tipo: string;
      usuario: string;
      contexto: string | null;
      ip: string | null;
      dispositivo: string | null;
      fecha: Date;
    }>;
  };
  inventario: {
    sinPropietario: number;
    sinArrendatario: number;
    desactualizados90Dias: number;
    porTipo: Array<{
      tipo: string;
      total: number;
    }>;
    porDestinacion: Array<{
      destinacion: string;
      total: number;
    }>;
  };
  tareasOperativas: {
    cargaPorUsuario: Array<{
      usuario: string;
      total: number;
    }>;
    matrizPrioridad: {
      urgenteEImportante: number;
      urgente: number;
      importante: number;
      rutinaria: number;
    };
    cumplimiento: {
      aTiempo: number;
      vencidas: number;
    };
  };
  mantenimientoYSoporte: {
    antiguedadPromedioDiasMantenimiento: number;
    mantenimientosEstancadosTotal: number;
    soportePorPrioridad: Array<{
      prioridad: TicketPrioridad;
      total: number;
    }>;
    soportePorEstado: Array<{
      estado: string;
      total: number;
    }>;
    mantenimientoPorContacto: Array<{
      contacto: string;
      total: number;
    }>;
  };
  archivados: {
    total: number;
    archivadosEnPeriodo: number;
    restauradosEnPeriodo: number;
  };
};

function getRangoFechas(periodo: PeriodoFiltro = "7d"): { desde: Date; hasta: Date } {
  const hasta = new Date();
  let desde: Date;

  if (periodo === "hoy") {
    // Inicio del día actual en Colombia (UTC-5)
    const bogotaNow = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(hasta);
    desde = new Date(`${bogotaNow}T00:00:00.000-05:00`);
  } else if (periodo === "30d") {
    desde = new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    // 7d por defecto
    desde = new Date(hasta.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { desde, hasta };
}

function esFueraDeHorarioColombia(date: Date): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    hour12: false,
    hour: "numeric",
    weekday: "short",
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
  const weekday = parts.find((p) => p.type === "weekday")?.value;

  if (weekday === "Sun") return true;
  if (weekday === "Sat" && hour >= 13) return true;
  if (hour < 6 || hour >= 20) return true;
  return false;
}

export async function getAdminPanelData(periodo: PeriodoFiltro = "7d"): Promise<AdminPanelData> {
  await requireAdmin();

  const { desde, hasta } = getRangoFechas(periodo);
  const ahora = new Date();
  const limiteOnline = new Date(ahora.getTime() - 3 * 60 * 1000); // 3 minutos
  const limite3DiasAtras = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000);
  const limite7DiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const limite24HorasAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const limite90DiasAtras = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    // 1. Alertas: Tareas vencidas > 3 días
    alertasTareasVencidas,
    // 1. Alertas: Mantenimientos estancados > 7 días
    alertasMantenimientoEstancado,
    // 1. Alertas: Intentos fallidos últimas 24h
    intentosFallidos24h,
    // 2. KPIs Inmuebles
    inmueblesPorEstado,
    inmueblesNuevosPeriodo,
    // 2. KPIs Tareas
    tareasPendientes,
    tareasVencidasTotal,
    tareasCompletadasPeriodo,
    tareasSinAsignar,
    // 2. KPIs Mantenimiento
    mantenimientosAbiertos,
    mantenimientosSinAsignar,
    mantenimientosEnProgreso,
    mantenimientosCompletadosPeriodo,
    // 2. KPIs Soporte
    soporteAbiertos,
    soporteUrgentesAbiertos,
    soporteEnProgreso,
    soporteResueltosPeriodo,
    // 2. KPIs Usuarios conectados y activos
    usuariosConectadosRaw,
    totalUsuariosActivos,
    // 3. Actividad del equipo
    usuariosList,
    actividadPeriodo,
    actividadPorModuloRaw,
    // 4. Seguridad y accesos
    accesosPorTipo,
    intentosFallidosRecientesRaw,
    dispositivosRaw,
    navegadoresRaw,
    accesosRecientesParaHorario,
    eventosSensiblesRaw,
    // 5. Inventario
    sinPropietario,
    sinArrendatario,
    desactualizados90Dias,
    inmueblesPorTipoRaw,
    inmueblesPorDestinacionRaw,
    // 6. Tareas operativas
    cargaTareasPorUsuarioRaw,
    tareasUrgenteImportante,
    tareasSoloUrgente,
    tareasSoloImportante,
    tareasRutinarias,
    tareasCompletadasATiempo,
    // 7. Mantenimiento y Soporte
    mantenimientosAbiertosParaAntiguedad,
    soportePorPrioridadRaw,
    soportePorEstadoRaw,
    mantenimientoPorContactoRaw,
    // 8. Archivados
    archivadosEnPeriodo,
    restauradosEnPeriodo,
  ] = await Promise.all([
    // 1. Alertas
    prisma.tarea.findMany({
      where: {
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        fechaLimite: { lt: limite3DiasAtras },
      },
      select: {
        id: true,
        titulo: true,
        fechaLimite: true,
        tipo: true,
        asignadaA: { select: { nombre: true } },
      },
      orderBy: { fechaLimite: "asc" },
      take: 10,
    }),
    prisma.tarea.findMany({
      where: {
        tipo: "MANTENIMIENTO",
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        updatedAt: { lt: limite7DiasAtras },
      },
      select: {
        id: true,
        titulo: true,
        estado: true,
        updatedAt: true,
        asignadaA: { select: { nombre: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    prisma.registroAcceso.findMany({
      where: {
        tipo: "LOGIN_FALLIDO",
        createdAt: { gte: limite24HorasAtras },
      },
      select: {
        ip: true,
        username: true,
        ciudad: true,
        pais: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),

    // 2. KPIs Inmuebles
    prisma.inmueble.groupBy({
      by: ["estado"],
      _count: { id: true },
    }),
    prisma.inmueble.count({
      where: { createdAt: { gte: desde, lte: hasta } },
    }),

    // 2. KPIs Tareas
    prisma.tarea.count({
      where: { tipo: "GENERAL", estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] } },
    }),
    prisma.tarea.count({
      where: {
        tipo: "GENERAL",
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        fechaLimite: { lt: ahora },
      },
    }),
    prisma.tarea.count({
      where: {
        tipo: "GENERAL",
        estado: "COMPLETADA",
        completedAt: { gte: desde, lte: hasta },
      },
    }),
    prisma.tarea.count({
      where: { tipo: "GENERAL", estado: "SIN_ASIGNAR" },
    }),

    // 2. KPIs Mantenimiento
    prisma.tarea.count({
      where: { tipo: "MANTENIMIENTO", estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] } },
    }),
    prisma.tarea.count({
      where: { tipo: "MANTENIMIENTO", estado: "SIN_ASIGNAR" },
    }),
    prisma.tarea.count({
      where: { tipo: "MANTENIMIENTO", estado: "EN_PROGRESO" },
    }),
    prisma.tarea.count({
      where: {
        tipo: "MANTENIMIENTO",
        estado: "COMPLETADA",
        completedAt: { gte: desde, lte: hasta },
      },
    }),

    // 2. KPIs Soporte
    prisma.soporteTicket.count({
      where: { estado: "ABIERTO" },
    }),
    prisma.soporteTicket.count({
      where: { estado: "ABIERTO", prioridad: "URGENTE" },
    }),
    prisma.soporteTicket.count({
      where: { estado: "EN_PROGRESO" },
    }),
    prisma.soporteTicket.count({
      where: {
        estado: { in: ["RESUELTO", "CERRADO"] },
        resolvedAt: { gte: desde, lte: hasta },
      },
    }),

    // 2. Presencia viva
    prisma.sesionPresencia.findMany({
      where: { ultimaActividad: { gte: limiteOnline } },
      include: {
        usuario: {
          select: { id: true, nombre: true, username: true, rol: true },
        },
      },
      orderBy: { ultimaActividad: "desc" },
    }),
    prisma.usuario.count({
      where: { estado: "ACTIVO" },
    }),

    // 3. Actividad del equipo
    prisma.usuario.findMany({
      where: { estado: "ACTIVO" },
      select: { id: true, nombre: true, username: true, rol: true },
    }),
    prisma.actividad.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      select: {
        userId: true,
        tipo: true,
        entidad: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.actividad.groupBy({
      by: ["entidad"],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),

    // 4. Seguridad
    prisma.registroAcceso.groupBy({
      by: ["tipo"],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
    prisma.registroAcceso.findMany({
      where: { tipo: "LOGIN_FALLIDO" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.registroAcceso.groupBy({
      by: ["dispositivo"],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
    prisma.registroAcceso.groupBy({
      by: ["navegador"],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.registroAcceso.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        username: true,
        ip: true,
        dispositivo: true,
        createdAt: true,
        tipo: true,
      },
    }),
    prisma.actividad.findMany({
      where: {
        tipo: {
          in: [
            "USUARIO_CREADO",
            "USUARIO_EDITADO",
            "USUARIO_ESTADO_CAMBIADO",
            "USUARIO_PASSWORD_CAMBIADO",
            "USUARIO_PASSWORD_RESETEADO",
            "INMUEBLE_ARCHIVADO",
            "INMUEBLE_RESTAURADO",
            "INMUEBLES_EXPORTADOS",
            "TAREAS_EXPORTADAS",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        usuario: { select: { nombre: true, username: true } },
      },
    }),

    // 5. Inventario
    prisma.inmueble.count({
      where: { estado: "ACTIVO", OR: [{ propietario: null }, { propietario: "" }] },
    }),
    prisma.inmueble.count({
      where: { estado: "ACTIVO", OR: [{ arrendatario: null }, { arrendatario: "" }] },
    }),
    prisma.inmueble.count({
      where: { estado: "ACTIVO", updatedAt: { lt: limite90DiasAtras } },
    }),
    prisma.inmueble.groupBy({
      by: ["tipoInmueble"],
      where: { estado: "ACTIVO" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.inmueble.groupBy({
      by: ["destinacion"],
      where: { estado: "ACTIVO" },
      _count: { id: true },
    }),

    // 6. Tareas operativas
    prisma.tarea.groupBy({
      by: ["assignedToId"],
      where: { estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] } },
      _count: { id: true },
    }),
    prisma.tarea.count({
      where: {
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        urgente: true,
        importante: true,
      },
    }),
    prisma.tarea.count({
      where: {
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        urgente: true,
        importante: false,
      },
    }),
    prisma.tarea.count({
      where: {
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        urgente: false,
        importante: true,
      },
    }),
    prisma.tarea.count({
      where: {
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
        urgente: false,
        importante: false,
      },
    }),
    prisma.tarea.count({
      where: {
        estado: "COMPLETADA",
        completedAt: { gte: desde, lte: hasta },
        fechaLimite: { not: null },
      },
    }),

    // 7. Mantenimiento y Soporte
    prisma.tarea.findMany({
      where: {
        tipo: "MANTENIMIENTO",
        estado: { in: ["SIN_ASIGNAR", "EN_PROGRESO"] },
      },
      select: { createdAt: true },
    }),
    prisma.soporteTicket.groupBy({
      by: ["prioridad"],
      where: { estado: { in: ["ABIERTO", "EN_PROGRESO"] } },
      _count: { id: true },
    }),
    prisma.soporteTicket.groupBy({
      by: ["estado"],
      _count: { id: true },
    }),
    prisma.tarea.groupBy({
      by: ["contacto"],
      where: { tipo: "MANTENIMIENTO" },
      _count: { id: true },
    }),

    // 8. Archivados
    prisma.actividad.count({
      where: { tipo: "INMUEBLE_ARCHIVADO", createdAt: { gte: desde, lte: hasta } },
    }),
    prisma.actividad.count({
      where: { tipo: "INMUEBLE_RESTAURADO", createdAt: { gte: desde, lte: hasta } },
    }),
  ]);

  // Procesamiento 1: Alertas - Intentos fallidos sospechosos (>= 3 fallos en 24h)
  const fallosPorIp = new Map<string, { count: number; ultimo: Date; ciudad: string | null; pais: string | null }>();
  const fallosPorUser = new Map<string, { count: number; ultimo: Date }>();

  for (const item of intentosFallidos24h) {
    if (item.ip) {
      const cur = fallosPorIp.get(item.ip) ?? { count: 0, ultimo: item.createdAt, ciudad: item.ciudad, pais: item.pais };
      cur.count++;
      if (item.createdAt > cur.ultimo) cur.ultimo = item.createdAt;
      fallosPorIp.set(item.ip, cur);
    }
    if (item.username) {
      const cur = fallosPorUser.get(item.username) ?? { count: 0, ultimo: item.createdAt };
      cur.count++;
      if (item.createdAt > cur.ultimo) cur.ultimo = item.createdAt;
      fallosPorUser.set(item.username, cur);
    }
  }

  const intentosFallidosSospechosos: AdminPanelData["alertas"]["intentosFallidosSospechosos"] = [];
  for (const [ip, datos] of fallosPorIp.entries()) {
    if (datos.count >= 3) {
      intentosFallidosSospechosos.push({
        identificador: ip,
        tipo: "IP",
        totalFallos: datos.count,
        ultimoFallo: datos.ultimo,
        ciudad: datos.ciudad,
        pais: datos.pais,
      });
    }
  }
  for (const [user, datos] of fallosPorUser.entries()) {
    if (datos.count >= 3 && !intentosFallidosSospechosos.some((s) => s.identificador === user)) {
      intentosFallidosSospechosos.push({
        identificador: user,
        tipo: "USUARIO",
        totalFallos: datos.count,
        ultimoFallo: datos.ultimo,
        ciudad: null,
        pais: null,
      });
    }
  }

  // Procesamiento 2: KPIs Inmuebles
  let inmueblesActivos = 0;
  let inmueblesArchivados = 0;
  for (const item of inmueblesPorEstado) {
    if (item.estado === "ACTIVO") inmueblesActivos = item._count.id;
    if (item.estado === "ARCHIVADO") inmueblesArchivados = item._count.id;
  }

  // Procesamiento 3: Presencia en vivo y equipo
  const conectados: AdminPanelData["equipo"]["conectados"] = usuariosConectadosRaw.map((s) => {
    const diffMinutos = Math.max(0, Math.floor((ahora.getTime() - s.ultimaActividad.getTime()) / 60000));
    return {
      id: s.id,
      userId: s.userId,
      nombre: s.usuario.nombre,
      username: s.usuario.username,
      rol: s.usuario.rol,
      dispositivo: s.dispositivo ?? "Desconocido",
      navegador: s.navegador ?? "Desconocido",
      sistemaOperativo: s.sistemaOperativo ?? "Desconocido",
      ip: s.ip,
      rutaActual: s.rutaActual,
      ultimaActividad: s.ultimaActividad,
      minutosInactivo: diffMinutos,
    };
  });

  const mapaUsuarios = new Map(usuariosList.map((u) => [u.id, u]));
  const actividadUserMap = new Map<string, { total: number; ultima: Date | null; desglose: Record<string, number> }>();

  for (const u of usuariosList) {
    actividadUserMap.set(u.id, { total: 0, ultima: null, desglose: {} });
  }

  for (const act of actividadPeriodo) {
    const userEntry = actividadUserMap.get(act.userId) ?? { total: 0, ultima: null, desglose: {} };
    userEntry.total++;
    if (!userEntry.ultima || act.createdAt > userEntry.ultima) {
      userEntry.ultima = act.createdAt;
    }
    userEntry.desglose[act.entidad] = (userEntry.desglose[act.entidad] ?? 0) + 1;
    actividadUserMap.set(act.userId, userEntry);
  }

  const resumenUsuarios: AdminPanelData["equipo"]["resumenUsuarios"] = Array.from(actividadUserMap.entries())
    .map(([userId, data]) => {
      const u = mapaUsuarios.get(userId);
      return {
        userId,
        nombre: u?.nombre ?? "Usuario Desconocido",
        username: u?.username ?? "desconocido",
        rol: u?.rol ?? "ASESOR",
        totalAcciones: data.total,
        ultimaAccion: data.ultima,
        desglose: data.desglose,
      };
    })
    .sort((a, b) => b.totalAcciones - a.totalAcciones);

  const actividadPorDiaMap = new Map<string, number>();
  for (const act of actividadPeriodo) {
    const dia = act.createdAt.toISOString().slice(0, 10);
    actividadPorDiaMap.set(dia, (actividadPorDiaMap.get(dia) ?? 0) + 1);
  }
  const actividadPorDia: AdminPanelData["equipo"]["actividadPorDia"] = Array.from(actividadPorDiaMap.entries())
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const actividadPorModulo: AdminPanelData["equipo"]["actividadPorModulo"] = actividadPorModuloRaw.map((m) => ({
    modulo: m.entidad,
    total: m._count.id,
  }));

  // Procesamiento 4: Seguridad y accesos
  let exitosos = 0;
  let fallidos = 0;
  let logouts = 0;
  for (const item of accesosPorTipo) {
    if (item.tipo === "LOGIN_EXITOSO") exitosos = item._count.id;
    if (item.tipo === "LOGIN_FALLIDO") fallidos = item._count.id;
    if (item.tipo === "LOGOUT") logouts = item._count.id;
  }

  const intentosFallidosRecientes: AdminPanelData["seguridad"]["intentosFallidosRecientes"] =
    intentosFallidosRecientesRaw.map((r) => ({
      id: r.id,
      username: r.username,
      ip: r.ip,
      dispositivo: r.dispositivo ?? "Desconocido",
      navegador: r.navegador ?? "Desconocido",
      sistemaOperativo: r.sistemaOperativo ?? "Desconocido",
      ciudad: r.ciudad,
      pais: r.pais,
      motivo: r.motivo,
      fecha: r.createdAt,
    }));

  const accesosFueraDeHorario: AdminPanelData["seguridad"]["accesosFueraDeHorario"] = accesosRecientesParaHorario
    .filter((a) => esFueraDeHorarioColombia(a.createdAt))
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      username: a.username,
      ip: a.ip,
      dispositivo: a.dispositivo ?? "Desconocido",
      fecha: a.createdAt,
      tipo: a.tipo,
    }));

  const eventosSensibles: AdminPanelData["seguridad"]["eventosSensibles"] = eventosSensiblesRaw.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    usuario: e.usuario?.nombre ?? "Sistema",
    contexto: e.context,
    ip: e.ip,
    dispositivo: e.dispositivo,
    fecha: e.createdAt,
  }));

  // Procesamiento 5: Tareas operativas por usuario
  const cargaPorUsuario: AdminPanelData["tareasOperativas"]["cargaPorUsuario"] = cargaTareasPorUsuarioRaw.map(
    (c) => {
      const nombre = c.assignedToId ? mapaUsuarios.get(c.assignedToId)?.nombre ?? "Usuario" : "Sin asignar";
      return {
        usuario: nombre,
        total: c._count.id,
      };
    }
  );

  // Procesamiento 6: Mantenimiento y Soporte
  let sumaDiasMantenimiento = 0;
  for (const m of mantenimientosAbiertosParaAntiguedad) {
    const diff = Math.max(0, Math.floor((ahora.getTime() - m.createdAt.getTime()) / (24 * 60 * 60 * 1000)));
    sumaDiasMantenimiento += diff;
  }
  const antiguedadPromedioDiasMantenimiento =
    mantenimientosAbiertosParaAntiguedad.length > 0
      ? Math.round(sumaDiasMantenimiento / mantenimientosAbiertosParaAntiguedad.length)
      : 0;

  return {
    periodo,
    fechaInicio: desde.toISOString(),
    generadoEn: ahora.toISOString(),
    alertas: {
      tareasVencidas: alertasTareasVencidas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        fechaLimite: t.fechaLimite,
        tipo: t.tipo,
        asignadoA: t.asignadaA?.nombre ?? null,
        diasVencida: t.fechaLimite
          ? Math.max(1, Math.floor((ahora.getTime() - t.fechaLimite.getTime()) / (24 * 60 * 60 * 1000)))
          : 0,
      })),
      mantenimientosEstancados: alertasMantenimientoEstancado.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        estado: m.estado,
        diasInactivo: Math.max(1, Math.floor((ahora.getTime() - m.updatedAt.getTime()) / (24 * 60 * 60 * 1000))),
        asignadoA: m.asignadaA?.nombre ?? null,
      })),
      intentosFallidosSospechosos,
    },
    kpis: {
      inmuebles: {
        activos: inmueblesActivos,
        archivados: inmueblesArchivados,
        total: inmueblesActivos + inmueblesArchivados,
        nuevosEnPeriodo: inmueblesNuevosPeriodo,
      },
      tareas: {
        pendientes: tareasPendientes,
        vencidas: tareasVencidasTotal,
        completadasEnPeriodo: tareasCompletadasPeriodo,
        sinAsignar: tareasSinAsignar,
      },
      mantenimiento: {
        abiertos: mantenimientosAbiertos,
        sinAsignar: mantenimientosSinAsignar,
        enProgreso: mantenimientosEnProgreso,
        completadosEnPeriodo: mantenimientosCompletadosPeriodo,
      },
      soporte: {
        abiertos: soporteAbiertos,
        urgentesAbiertos: soporteUrgentesAbiertos,
        enProgreso: soporteEnProgreso,
        resueltosEnPeriodo: soporteResueltosPeriodo,
      },
      equipo: {
        conectadosAhora: conectados.length,
        totalActivos: totalUsuariosActivos,
      },
    },
    equipo: {
      conectados,
      resumenUsuarios,
      actividadPorDia,
      actividadPorModulo,
    },
    seguridad: {
      resumenAccesos: {
        exitosos,
        fallidos,
        logouts,
      },
      intentosFallidosRecientes,
      dispositivos: dispositivosRaw.map((d) => ({
        tipo: d.dispositivo ?? "Desconocido",
        total: d._count.id,
      })),
      navegadores: navegadoresRaw.map((n) => ({
        nombre: n.navegador ?? "Desconocido",
        total: n._count.id,
      })),
      accesosFueraDeHorario,
      eventosSensibles,
    },
    inventario: {
      sinPropietario,
      sinArrendatario,
      desactualizados90Dias,
      porTipo: inmueblesPorTipoRaw.map((t) => ({
        tipo: t.tipoInmueble ?? "Sin especificar",
        total: t._count.id,
      })),
      porDestinacion: inmueblesPorDestinacionRaw.map((d) => ({
        destinacion: d.destinacion ?? "Sin especificar",
        total: d._count.id,
      })),
    },
    tareasOperativas: {
      cargaPorUsuario,
      matrizPrioridad: {
        urgenteEImportante: tareasUrgenteImportante,
        urgente: tareasSoloUrgente,
        importante: tareasSoloImportante,
        rutinaria: tareasRutinarias,
      },
      cumplimiento: {
        aTiempo: tareasCompletadasATiempo,
        vencidas: Math.max(0, tareasCompletadasPeriodo - tareasCompletadasATiempo),
      },
    },
    mantenimientoYSoporte: {
      antiguedadPromedioDiasMantenimiento,
      mantenimientosEstancadosTotal: alertasMantenimientoEstancado.length,
      soportePorPrioridad: soportePorPrioridadRaw.map((p) => ({
        prioridad: p.prioridad,
        total: p._count.id,
      })),
      soportePorEstado: soportePorEstadoRaw.map((e) => ({
        estado: e.estado,
        total: e._count.id,
      })),
      mantenimientoPorContacto: mantenimientoPorContactoRaw.map((c) => ({
        contacto: c.contacto ?? "Sin definir",
        total: c._count.id,
      })),
    },
    archivados: {
      total: inmueblesArchivados,
      archivadosEnPeriodo,
      restauradosEnPeriodo,
    },
  };
}
