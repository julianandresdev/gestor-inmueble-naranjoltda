import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActividadItem } from "@/lib/audit";
import type {
  Prisma,
  Rol,
  Destinacion,
  TareaEstado,
  TicketEstado,
  TicketPrioridad,
} from "@/generated/prisma/client";

export type SafeUser = {
  id: string;
  nombre: string;
  username: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO";
  createdAt: Date;
  updatedAt: Date;
};

const selectSafe = {
  id: true,
  nombre: true,
  username: true,
  rol: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

export const requireAuth = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

export const requireAdmin = cache(async () => {
  const user = await requireAuth();
  if (user.role !== "ADMIN") redirect("/inicio");
  return user;
});

export async function listUsuarios(): Promise<SafeUser[]> {
  await requireAdmin();
  return prisma.usuario.findMany({
    select: selectSafe,
    orderBy: [{ createdAt: "asc" }],
  });
}

export type InmuebleListItem = {
  id: string;
  noInm: string;
  barrio: string | null;
  ciudad: string | null;
  tipoInmueble: string | null;
  destinacion: Destinacion | null;
  direccion: string | null;
  arrendatario: string | null;
};

const selectInmuebleListItem = {
  id: true,
  noInm: true,
  barrio: true,
  ciudad: true,
  tipoInmueble: true,
  destinacion: true,
  direccion: true,
  arrendatario: true,
} as const;

export type InmuebleFiltros = {
  q?: string;
  ciudad?: string;
  barrio?: string;
  tipoInmueble?: string;
  destinacion?: Destinacion | null;
};

function buildWhere(filtros: InmuebleFiltros): Prisma.InmuebleWhereInput {
  const where: Prisma.InmuebleWhereInput = { estado: "ACTIVO" };

  if (filtros.q && filtros.q.trim()) {
    const t = filtros.q.trim();
    where.OR = [
      { noInm: { contains: t, mode: "insensitive" } },
      { direccion: { contains: t, mode: "insensitive" } },
      { barrio: { contains: t, mode: "insensitive" } },
      { ciudad: { contains: t, mode: "insensitive" } },
      { arrendatario: { contains: t, mode: "insensitive" } },
      { docArrendatario: { contains: t, mode: "insensitive" } },
      { celArre1: { contains: t, mode: "insensitive" } },
      { propietario: { contains: t, mode: "insensitive" } },
      { docPropietario: { contains: t, mode: "insensitive" } },
      { celPro1: { contains: t, mode: "insensitive" } },
    ];
  }
  if (filtros.ciudad) where.ciudad = { equals: filtros.ciudad };
  if (filtros.barrio) where.barrio = { equals: filtros.barrio };
  if (filtros.tipoInmueble) where.tipoInmueble = { equals: filtros.tipoInmueble };
  if (filtros.destinacion)
    where.destinacion = { equals: filtros.destinacion };

  return where;
}

export async function listInmuebles(
  filtros: InmuebleFiltros = {}
): Promise<InmuebleListItem[]> {
  await requireAuth();
  return prisma.inmueble.findMany({
    where: buildWhere(filtros),
    select: selectInmuebleListItem,
    orderBy: [{ noInm: "asc" }],
  });
}

export async function getOpcionesFiltros() {
  await requireAuth();
  const [ciudades, barrios, tipos] = await Promise.all([
    prisma.inmueble.findMany({
      where: { estado: "ACTIVO" },
      distinct: ["ciudad"],
      select: { ciudad: true },
    }),
    prisma.inmueble.findMany({
      where: { estado: "ACTIVO" },
      distinct: ["barrio"],
      select: { barrio: true },
    }),
    prisma.inmueble.findMany({
      where: { estado: "ACTIVO" },
      distinct: ["tipoInmueble"],
      select: { tipoInmueble: true },
    }),
  ]);
  return {
    ciudades: ciudades.map((c) => c.ciudad).filter(Boolean) as string[],
    barrios: barrios.map((b) => b.barrio).filter(Boolean) as string[],
    tipos: tipos.map((t) => t.tipoInmueble).filter(Boolean) as string[],
  };
}

export type InmuebleDetalle = Awaited<
  ReturnType<typeof prisma.inmueble.findUnique>
> & {};

export async function getInmueble(id: string) {
  await requireAuth();
  return prisma.inmueble.findUnique({
    where: { id },
    include: {
      creadoPor: { select: { id: true, nombre: true, username: true } },
      modificadoPor: { select: { id: true, nombre: true, username: true } },
    },
  });
}

export type NotaConAutor = {
  id: string;
  contenido: string;
  createdAt: Date;
  autor: { nombre: string; username: string };
};

export async function listarNotas(inmuebleId: string): Promise<NotaConAutor[]> {
  await requireAuth();
  return prisma.nota.findMany({
    where: { inmuebleId },
    select: {
      id: true,
      contenido: true,
      createdAt: true,
      autor: { select: { nombre: true, username: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export type TareaListItem = {
  id: string;
  titulo: string;
  estado: TareaEstado;
  importante: boolean;
  urgente: boolean;
  fechaLimite: Date | null;
  createdAt: Date;
  inmueble: { id: string; noInm: string } | null;
  asignadaA: { id: string; nombre: string } | null;
};

export type TareaFiltros = {
  q?: string;
  estado?: TareaEstado;
  responsable?: string;
  importante?: boolean;
  urgente?: boolean;
  vencidas?: boolean;
  tipo?: "con-inmueble" | "generales";
};

function buildTareaWhere(filtros: TareaFiltros): Prisma.TareaWhereInput {
  const where: Prisma.TareaWhereInput = {
    estado: { not: "ARCHIVADA" },
  };

  if (filtros.q && filtros.q.trim()) {
    const t = filtros.q.trim();
    where.OR = [
      { titulo: { contains: t, mode: "insensitive" } },
      { descripcion: { contains: t, mode: "insensitive" } },
    ];
  }
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.responsable) where.assignedToId = filtros.responsable;
  if (filtros.importante) where.importante = true;
  if (filtros.urgente) where.urgente = true;
  if (filtros.vencidas) {
    where.fechaLimite = { lt: new Date() };
    where.estado = { notIn: ["COMPLETADA", "CANCELADA"] };
  }
  if (filtros.tipo === "con-inmueble") where.inmuebleId = { not: null };
  if (filtros.tipo === "generales") where.inmuebleId = null;

  return where;
}

export async function listTareas(
  filtros: TareaFiltros = {}
): Promise<TareaListItem[]> {
  await requireAuth();
  return prisma.tarea.findMany({
    where: buildTareaWhere(filtros),
    select: {
      id: true,
      titulo: true,
      estado: true,
      importante: true,
      urgente: true,
      fechaLimite: true,
      createdAt: true,
      inmueble: { select: { id: true, noInm: true } },
      asignadaA: { select: { id: true, nombre: true } },
    },
    orderBy: [{ fechaLimite: "asc" }, { createdAt: "desc" }],
  });
}

export async function getResumenTareas() {
  await requireAuth();
  const agrupadas = await prisma.tarea.groupBy({
    by: ["estado"],
    where: { estado: { not: "ARCHIVADA" } },
    _count: { _all: true },
  });
  const conteo: Record<string, number> = {};
  for (const g of agrupadas) {
    conteo[g.estado] = g._count._all;
  }
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  return {
    total,
    sinAsignar: conteo["SIN_ASIGNAR"] ?? 0,
    enProgreso: conteo["EN_PROGRESO"] ?? 0,
    completadas: conteo["COMPLETADA"] ?? 0,
  };
}

export async function listResponsables() {
  await requireAuth();
  const rows = await prisma.tarea.findMany({
    where: { estado: { not: "ARCHIVADA" }, assignedToId: { not: null } },
    distinct: ["assignedToId"],
    select: { asignadaA: { select: { id: true, nombre: true } } },
  });
  return rows
    .map((r) => r.asignadaA)
    .filter((u): u is { id: string; nombre: string } => u !== null);
}

export type TareaDetalle = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: TareaEstado;
  importante: boolean;
  urgente: boolean;
  fechaLimite: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  inmueble: { id: string; noInm: string } | null;
  creadoPor: { id: string; nombre: string };
  asignadaA: { id: string; nombre: string } | null;
};

export async function getTarea(id: string): Promise<TareaDetalle | null> {
  await requireAuth();
  return prisma.tarea.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      importante: true,
      urgente: true,
      fechaLimite: true,
      createdAt: true,
      completedAt: true,
      inmueble: { select: { id: true, noInm: true } },
      creadoPor: { select: { id: true, nombre: true } },
      asignadaA: { select: { id: true, nombre: true } },
    },
  });
}

export async function listOpcionesInmuebles() {
  await requireAuth();
  return prisma.inmueble.findMany({
    where: { estado: "ACTIVO" },
    select: { id: true, noInm: true, direccion: true },
    orderBy: [{ noInm: "asc" }],
  });
}

export type InmuebleArchivadoItem = {
  id: string;
  noInm: string;
  barrio: string | null;
  ciudad: string | null;
  tipoInmueble: string | null;
  direccion: string | null;
  updatedAt: Date;
  modificadoPor: { id: string; nombre: string };
};

export async function listInmueblesArchivados(): Promise<InmuebleArchivadoItem[]> {
  await requireAdmin();
  return prisma.inmueble.findMany({
    where: { estado: "ARCHIVADO" },
    select: {
      id: true,
      noInm: true,
      barrio: true,
      ciudad: true,
      tipoInmueble: true,
      direccion: true,
      updatedAt: true,
      modificadoPor: { select: { id: true, nombre: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export type DashboardTareaItem = {
  id: string;
  titulo: string;
  estado: TareaEstado;
  importante: boolean;
  urgente: boolean;
  fechaLimite: Date | null;
  inmueble: { id: string; noInm: string } | null;
  asignadaA: { id: string; nombre: string } | null;
};

export type DashboardActividadItem = {
  id: string;
  kind: "inmueble" | "nota" | "tarea" | "tarea-completada";
  titulo: string;
  user: string;
  at: Date;
  href: string;
};

export type DashboardData = {
  kpis: {
    inmueblesActivos: number;
    tareasActivas: number;
    tareasSinAsignar: number;
    tareasEnProgreso: number;
    tareasVencidas: number;
    tareasUrgentesPendientes: number;
    soporteAbiertos: number;
    soporteEnProgreso: number;
  };
  tareasPrioritarias: DashboardTareaItem[];
};

export async function getDashboardData(): Promise<DashboardData> {
  await requireAuth();

  const now = new Date();

  const [
    inmueblesActivos,
    activasAgrupadas,
    vencidas,
    urgentesPendientes,
    prioridades,
  ] = await Promise.all([
    prisma.inmueble.count({ where: { estado: "ACTIVO" } }),
    prisma.tarea.groupBy({
      by: ["estado"],
      where: { estado: { not: "ARCHIVADA" } },
      _count: { _all: true },
    }),
    prisma.tarea.count({
      where: {
        estado: { notIn: ["COMPLETADA", "CANCELADA", "ARCHIVADA"] },
        fechaLimite: { lt: now },
      },
    }),
    prisma.tarea.count({
      where: {
        estado: { notIn: ["COMPLETADA", "CANCELADA", "ARCHIVADA"] },
        urgente: true,
      },
    }),
    prisma.tarea.findMany({
      where: {
        estado: { notIn: ["COMPLETADA", "CANCELADA", "ARCHIVADA"] },
        OR: [
          { fechaLimite: { lt: now } },
          { urgente: true },
          { importante: true },
          { estado: "SIN_ASIGNAR" },
        ],
      },
      orderBy: [{ fechaLimite: "asc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        titulo: true,
        estado: true,
        importante: true,
        urgente: true,
        fechaLimite: true,
        inmueble: { select: { id: true, noInm: true } },
        asignadaA: { select: { id: true, nombre: true } },
      },
    }),
  ]);

  const conteo: Record<string, number> = {};
  for (const g of activasAgrupadas) {
    conteo[g.estado] = g._count._all;
  }
  const tareasActivas = Object.values(conteo).reduce((a, b) => a + b, 0);

  const soporteKpis = await getSoporteKpis();

  return {
    kpis: {
      inmueblesActivos,
      tareasActivas,
      tareasSinAsignar: conteo["SIN_ASIGNAR"] ?? 0,
      tareasEnProgreso: conteo["EN_PROGRESO"] ?? 0,
      tareasVencidas: vencidas,
      tareasUrgentesPendientes: urgentesPendientes,
      soporteAbiertos: soporteKpis.soporteAbiertos,
      soporteEnProgreso: soporteKpis.soporteEnProgreso,
    },
    tareasPrioritarias: prioridades,
  };
}

export type SoporteTicketListItem = {
  id: string;
  titulo: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  createdAt: Date;
  updatedAt: Date;
  creadoPor: { id: string; nombre: string };
  mensajesCount: number;
};

export type SoporteTicketDetalle = {
  id: string;
  titulo: string;
  descripcion: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  creadoPor: { id: string; nombre: string };
  cerradoPor: { id: string; nombre: string } | null;
};

export type SoporteMensajeItem = {
  id: string;
  contenido: string;
  createdAt: Date;
  autor: { id: string; nombre: string };
};

export type SoporteFiltros = {
  q?: string;
  estado?: TicketEstado;
  prioridad?: TicketPrioridad;
};

function buildSoporteWhere(
  userId: string,
  isAdmin: boolean,
  filtros: SoporteFiltros
): Prisma.SoporteTicketWhereInput {
  const where: Prisma.SoporteTicketWhereInput = isAdmin
    ? {}
    : { createdById: userId };

  if (filtros.q && filtros.q.trim()) {
    const t = filtros.q.trim();
    where.OR = [
      { titulo: { contains: t, mode: "insensitive" } },
      { descripcion: { contains: t, mode: "insensitive" } },
    ];
  }
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.prioridad) where.prioridad = filtros.prioridad;

  return where;
}

export async function listSoporteTickets(
  filtros: SoporteFiltros = {}
): Promise<SoporteTicketListItem[]> {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  const tickets = await prisma.soporteTicket.findMany({
    where: buildSoporteWhere(user.id, isAdmin, filtros),
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      titulo: true,
      estado: true,
      prioridad: true,
      createdAt: true,
      updatedAt: true,
      creadoPor: { select: { id: true, nombre: true } },
      _count: { select: { mensajes: true } },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    estado: t.estado,
    prioridad: t.prioridad,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    creadoPor: t.creadoPor,
    mensajesCount: t._count.mensajes,
  }));
}

export async function getSoporteTicket(
  id: string
): Promise<SoporteTicketDetalle | null> {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  const ticket = await prisma.soporteTicket.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      prioridad: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      creadoPor: { select: { id: true, nombre: true } },
      cerradoPor: { select: { id: true, nombre: true } },
    },
  });
  if (!ticket) return null;
  if (!isAdmin && ticket.creadoPor.id !== user.id) return null;
  return ticket;
}

export async function listSoporteMensajes(
  ticketId: string
): Promise<SoporteMensajeItem[]> {
  await requireAuth();
  return prisma.soporteMensaje.findMany({
    where: { ticketId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      contenido: true,
      createdAt: true,
      autor: { select: { id: true, nombre: true } },
    },
  });
}

export async function listarActividadSoporte(
  ticketId: string
): Promise<ActividadItem[]> {
  const rows = await prisma.actividad.findMany({
    where: { soporteTicketId: ticketId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      context: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    user: r.usuario.nombre,
    context: r.context,
    createdAt: r.createdAt,
  }));
}

export type SoporteKpis = {
  soporteAbiertos: number;
  soporteEnProgreso: number;
};

export async function getSoporteKpis(): Promise<SoporteKpis> {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";
  const baseWhere: Prisma.SoporteTicketWhereInput = isAdmin
    ? {}
    : { createdById: user.id };

  const [abiertos, enProgreso] = await Promise.all([
    prisma.soporteTicket.count({
      where: { ...baseWhere, estado: "ABIERTO" },
    }),
    prisma.soporteTicket.count({
      where: { ...baseWhere, estado: "EN_PROGRESO" },
    }),
  ]);

  return {
    soporteAbiertos: abiertos,
    soporteEnProgreso: enProgreso,
  };
}