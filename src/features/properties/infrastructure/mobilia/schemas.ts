import { z } from "astro/zod";

/**
 * Raw Mobilia shapes (spec: Mobilia Public API v1.0). Only the fields the site maps are
 * declared: Zod strips everything else, so private fields (`direccionPrivada`, owners,
 * keys, `archivos`, cadastral reference...) never leave this boundary (AGENTS.md §5).
 * The exact location (`latitud`, `longitud`, `direccionPublica`, `mostrarDireccionExacta`)
 * is not declared either: the site only ever shows the approximate zone.
 * The API omits null fields and the spec marks almost everything nullable: `nullish()`.
 */

const text = z.string().nullish();
const num = z.number().nullish();
const flag = z.boolean().nullish();

/** Per-language blocks (`tituloWeb`, `tipoInmueble`...): keys are suffixed per language. */
const localizedBlock = z.record(z.string(), z.unknown()).nullish();

export const mobiliaTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  token_type: text,
});

export const mobiliaPagedSchema = z.object({
  elementos: z.array(z.unknown()).nullish(),
  totalElementos: z.number().int().nonnegative(),
  pagina: num,
  tamanoPagina: num,
});

export const mobiliaPhotoSchema = z
  .object({
    url: text,
    orden: num,
    destacada: flag,
  })
  // Keeps `descripcion{,Ca,En,It}` captions (only requested with DescripcionImagenes=true).
  .catchall(z.unknown());

export const mobiliaFeaturesSchema = z.object({
  metrosConstruidos: num,
  metrosUtiles: num,
  metrosParcela: num,
  metrosTerrazas: num,
  metrosJardin: num,
  habitaciones: num,
  banos: num,
  aseos: num,
  ascensor: flag,
  aireAcondicionado: flag,
  terrazas: num,
  jardin: flag,
  piscinaComunitaria: flag,
  piscinaPrivada: flag,
  plazasGaraje: num,
  plazasParking: num,
  trastero: num,
  amueblado: flag,
  exterior: flag,
  armarios: flag,
  admiteMascotas: flag,
  conserje: flag,
});

export const mobiliaInmuebleSchema = z.object({
  referencia: z.string().trim().min(1),
  venta: flag,
  alquiler: flag,
  alquilerTemporada: flag,
  traspaso: flag,
  precioVenta: num,
  precioAlquiler: num,
  precioTraspaso: num,
  precioVentaAConsultar: flag,
  precioAlquilerAConsultar: flag,
  precioTraspasoAConsultar: flag,
  reservado: flag,
  portadaWeb: flag,
  publicarEnWeb: flag,
  activo: flag,
  mostrarAntiguedad: flag,
  anoConstruccion: num,
  planta: text,
  latitudZona: text,
  longitudZona: text,
  radioZona: num,
  nombreZona: text,
  nombreGrupoZona: text,
  poblacion: text,
  idAgenteVenta: num,
  idAgenteAlquiler: num,
  idAgenteTraspaso: num,
  urlVisitaVirtual: text,
  fechaCaptacion: text,
  fechaUltimaModificacion: text,
  fechaUltimaModificacionWeb: text,
  tituloWeb: localizedBlock,
  descripcionWeb: localizedBlock,
  descripcionAmpliada: localizedBlock,
  tipoInmueble: localizedBlock,
  conservacionInmueble: localizedBlock,
  calificacionEnergetica: localizedBlock,
  calificacionEmisiones: localizedBlock,
  caracteristicas: mobiliaFeaturesSchema.nullish(),
  fotos: z.array(mobiliaPhotoSchema).nullish(),
});

export const mobiliaAgenteSchema = z.object({
  idAgente: z.number().int().positive(),
  nombreUsuario: text,
  email: text,
});

export type MobiliaToken = z.infer<typeof mobiliaTokenSchema>;
export type MobiliaInmueble = z.infer<typeof mobiliaInmuebleSchema>;
export type MobiliaPhoto = z.infer<typeof mobiliaPhotoSchema>;
export type MobiliaAgente = z.infer<typeof mobiliaAgenteSchema>;
