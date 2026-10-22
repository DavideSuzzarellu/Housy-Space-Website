import { LOCALES, type Locale } from "@/shared/i18n/config";
import {
  ENERGY_GRADES,
  toAgentId,
  toAreaM2,
  toIsoDateTime,
  toPriceEUR,
  toPropertyRef,
  type AgentId,
  type AreaM2,
  type EnergyRating,
  type LocalizedText,
  type Operation,
  type Price,
  type Property,
  type PropertyFeature,
  type PropertyLocation,
  type PropertyPhoto,
} from "../../domain/property";
import { htmlToPlainText } from "./htmlToPlainText";
import type { MobiliaInmueble, MobiliaPhoto } from "./schemas";

/** Mobilia language suffixes for the site locales (`es` is the unsuffixed base field). */
const LOCALE_SUFFIX = { es: "", en: "En", it: "It", ca: "Ca" } as const satisfies Record<
  Locale,
  string
>;

/** Used only as a sort key when Mobilia sends no modification date at all. */
const EPOCH = "1970-01-01T00:00:00.000Z";

type RawBlock = Readonly<Record<string, unknown>> | null | undefined;

function pickLocalized(
  block: RawBlock,
  baseKey: string,
  transform: (value: string) => string = (value) => value.trim(),
): LocalizedText {
  if (block === null || block === undefined) return {};
  const result: Partial<Record<Locale, string>> = {};
  for (const locale of LOCALES) {
    const value = block[`${baseKey}${LOCALE_SUFFIX[locale]}`];
    if (typeof value !== "string") continue;
    const cleaned = transform(value);
    if (cleaned !== "") result[locale] = cleaned;
  }
  return result;
}

export function isPublishable(raw: MobiliaInmueble): boolean {
  return raw.publicarEnWeb === true && raw.activo === true;
}

function operationsOf(raw: MobiliaInmueble): Operation[] {
  const operations: Operation[] = [];
  if (raw.venta === true) operations.push("sale");
  if (raw.alquiler === true || raw.alquilerTemporada === true) operations.push("rent");
  if (raw.traspaso === true) operations.push("transfer");
  return operations;
}

function priceOf(
  amount: number | null | undefined,
  onRequest: boolean | null | undefined,
): Price | undefined {
  if (onRequest === true) return { kind: "onRequest" };
  if (typeof amount === "number" && amount > 0)
    return { kind: "amount", amount: toPriceEUR(amount) };
  return undefined;
}

function pricesOf(raw: MobiliaInmueble, operations: readonly Operation[]): Property["prices"] {
  const candidates = {
    sale: priceOf(raw.precioVenta, raw.precioVentaAConsultar),
    rent: priceOf(raw.precioAlquiler, raw.precioAlquilerAConsultar),
    transfer: priceOf(raw.precioTraspaso, raw.precioTraspasoAConsultar),
  } as const;
  const prices: Partial<Record<Operation, Price>> = {};
  for (const operation of operations) {
    const price = candidates[operation];
    if (price !== undefined) prices[operation] = price;
  }
  return prices;
}

function energyOf(block: RawBlock): EnergyRating | undefined {
  const value = block?.["calificacion"];
  if (typeof value !== "string") return undefined;
  const label = value.trim();
  const grade = ENERGY_GRADES.find((candidate) => candidate === label.toUpperCase());
  if (grade !== undefined) return { kind: "grade", grade };
  if (/pendiente|tr[aá]mite/i.test(label)) return { kind: "pending" };
  if (/exento/i.test(label)) return { kind: "exempt" };
  return undefined;
}

function areaOf(value: number | null | undefined): AreaM2 | undefined {
  return typeof value === "number" && value > 0 ? toAreaM2(value) : undefined;
}

function countOf(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function featuresOf(raw: MobiliaInmueble): PropertyFeature[] {
  const f = raw.caracteristicas;
  if (f === null || f === undefined) return [];
  const positive = (value: number | null | undefined): boolean =>
    typeof value === "number" && value > 0;
  const checks: readonly (readonly [PropertyFeature, boolean])[] = [
    ["lift", f.ascensor === true],
    ["airConditioning", f.aireAcondicionado === true],
    ["terrace", positive(f.terrazas) || positive(f.metrosTerrazas)],
    ["garden", f.jardin === true || positive(f.metrosJardin)],
    ["communalPool", f.piscinaComunitaria === true],
    ["privatePool", f.piscinaPrivada === true],
    ["parking", positive(f.plazasGaraje) || positive(f.plazasParking)],
    ["storageRoom", positive(f.trastero)],
    ["furnished", f.amueblado === true],
    ["exterior", f.exterior === true],
    ["builtInWardrobes", f.armarios === true],
    ["petsAllowed", f.admiteMascotas === true],
    ["concierge", f.conserje === true],
  ];
  return checks.filter(([, present]) => present).map(([feature]) => feature);
}

const TRACKING_PARAM = /^utm_/i;

export function stripTrackingParams(url: string): string {
  const parsed = new URL(url);
  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) parsed.searchParams.delete(key);
  }
  return parsed.href;
}

function safeHttpsUrl(value: string | null | undefined): string | undefined {
  if (typeof value !== "string" || !URL.canParse(value)) return undefined;
  const url = new URL(value);
  return url.protocol === "https:" ? stripTrackingParams(url.href) : undefined;
}

function photosOf(photos: readonly MobiliaPhoto[] | null | undefined): PropertyPhoto[] {
  if (photos === null || photos === undefined) return [];
  return photos
    .map((photo, index) => ({ photo, index, url: safeHttpsUrl(photo.url) }))
    .filter((entry): entry is typeof entry & { url: string } => entry.url !== undefined)
    .sort((a, b) => {
      const highlighted = Number(b.photo.destacada === true) - Number(a.photo.destacada === true);
      if (highlighted !== 0) return highlighted;
      return (a.photo.orden ?? a.index) - (b.photo.orden ?? b.index);
    })
    .map(({ photo, url }) => ({ url, caption: pickLocalized(photo, "descripcion") }));
}

function coordinate(value: string | null | undefined, limit: number): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : undefined;
}

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === "" ? undefined : trimmed;
}

/**
 * Privacy (AGENTS.md §5): always the Mobilia zone, even when `mostrarDireccionExacta` is true.
 * Exact coordinates and the address are not even parsed (see `schemas.ts`).
 */
function locationOf(raw: MobiliaInmueble): PropertyLocation | undefined {
  const latitude = coordinate(raw.latitudZona, 90);
  const longitude = coordinate(raw.longitudZona, 180);
  if (latitude === undefined || longitude === undefined) return undefined;
  return {
    latitude,
    longitude,
    radiusM: typeof raw.radioZona === "number" && raw.radioZona > 0 ? raw.radioZona : 0,
    zone: nonEmpty(raw.nombreZona) ?? nonEmpty(raw.nombreGrupoZona),
    city: nonEmpty(raw.poblacion),
  };
}

function agentOf(raw: MobiliaInmueble, operations: readonly Operation[]): AgentId | undefined {
  const byOperation = {
    sale: raw.idAgenteVenta,
    rent: raw.idAgenteAlquiler,
    transfer: raw.idAgenteTraspaso,
  } as const;
  for (const operation of operations) {
    const id = byOperation[operation];
    if (typeof id === "number" && Number.isInteger(id) && id > 0) return toAgentId(id);
  }
  return undefined;
}

function dateOf(value: string | null | undefined): Property["listedAt"] {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? toIsoDateTime(value)
    : undefined;
}

/** Validated raw Mobilia inmueble → domain `Property` (pure, deterministic). */
export function mapInmueble(raw: MobiliaInmueble): Property {
  const operations = operationsOf(raw);
  const features = raw.caracteristicas;
  return {
    ref: toPropertyRef(raw.referencia),
    operations,
    prices: pricesOf(raw, operations),
    status: raw.reservado === true ? "reserved" : "available",
    featured: raw.portadaWeb === true,
    title: pickLocalized(raw.tituloWeb, "txtTituloWeb"),
    summary: pickLocalized(raw.descripcionWeb, "txtDescripcionWeb", htmlToPlainText),
    description: pickLocalized(raw.descripcionAmpliada, "txtDescripcionAmpliada", htmlToPlainText),
    propertyType: pickLocalized(raw.tipoInmueble, "tipoInmueble"),
    condition: pickLocalized(raw.conservacionInmueble, "conservacion"),
    builtArea: areaOf(features?.metrosConstruidos),
    usableArea: areaOf(features?.metrosUtiles),
    plotArea: areaOf(features?.metrosParcela),
    terraceArea: areaOf(features?.metrosTerrazas),
    gardenArea: areaOf(features?.metrosJardin),
    bedrooms: countOf(features?.habitaciones),
    bathrooms: countOf(features?.banos),
    toilets: countOf(features?.aseos),
    yearBuilt:
      raw.mostrarAntiguedad === true && typeof raw.anoConstruccion === "number"
        ? raw.anoConstruccion
        : undefined,
    floor: nonEmpty(raw.planta),
    energyRating: energyOf(raw.calificacionEnergetica),
    emissionsRating: energyOf(raw.calificacionEmisiones),
    features: featuresOf(raw),
    photos: photosOf(raw.fotos),
    location: locationOf(raw),
    agentId: agentOf(raw, operations),
    virtualTourUrl: safeHttpsUrl(raw.urlVisitaVirtual),
    updatedAt:
      dateOf(raw.fechaUltimaModificacionWeb) ??
      dateOf(raw.fechaUltimaModificacion) ??
      toIsoDateTime(EPOCH),
    listedAt: dateOf(raw.fechaCaptacion),
  };
}
