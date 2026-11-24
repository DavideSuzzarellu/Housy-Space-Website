# Plantilla de artículo del blog

Copia este archivo a `src/content/blog/<slug>.md`. **El nombre del archivo es la URL** (`/es/blog/<slug>`):
minúsculas, sin acentos, guiones, sin espacio y sin cambiarlo una vez publicado.
Los comentarios (`#`) son solo para ti: bórralos en el artículo.

Todo lo que no cumpla el esquema rompe la compilación; todo lo demás lo revisa `bun run blog:check`
(ver `flujo-editorial.md`). **Nunca pongas `status: publicado` por tu cuenta**: solo tras la aprobación
de Davide Oggiano de esta versión.

```markdown
---
# ── Identidad ─────────────────────────────────────────────────────────────
title: ¿Cuánto vale mi piso en Barcelona? # H1 de la página. Con la palabra clave. Máx. 60 caracteres si no hay seoTitle.
seoTitle: # Opcional. Máx. 60 caracteres. Es el <title> de Google si existe.
description: # 140-155 caracteres exactos (obligatorio salvo en borrador). Responde a la búsqueda y anima a entrar.
articleId: HS-2026-11-01 # HS-AAAA-MM-NN. Único: mira docs/blog/inventario-articulos.md y usa el siguiente número libre.
date: 2026-12-01 # Fecha de publicación. Una fecha futura PROGRAMA el artículo (sale en la primera reconstrucción diaria tras esa fecha).
updatedAt: # Solo cuando se revisa de verdad y cambia el contenido (nunca por inercia). Se muestra «Actualizado el…».
author: # Opcional. Vacío = HousySpace (organización).
language: es # es | en | it | ca. Idioma en el que está escrito; solo se indexa en esa versión.

# ── Posicionamiento (ficha SEO de housyspace-seo §10) ─────────────────────
keyword: cuánto vale mi piso en Barcelona # Palabra clave principal. ÚNICA en todo el blog (canibalización). Debe estar en el título y en las 100 primeras palabras, tal cual.
intent: informacional # informacional | comercial | transaccional
secondaryKeywords: # Opcional.
  - valoración de un piso
  - precio de venta
cluster: A # A valoración y precio · B gastos e impuestos · C proceso de venta · D situaciones especiales
pillar: false # true solo para el artículo principal del grupo.
category: valoracion # valoracion | venta | gastos-impuestos | herencias | contratos-documentacion | mercado-barcelona

# ── Captación ─────────────────────────────────────────────────────────────
cta: valoracion # valoracion → /valoracion · venta → /servicios/venta-estrategica · consulta → /contacto. La web pinta el bloque final sola.

# ── Imagen principal (obligatoria) ────────────────────────────────────────
image: ../../assets/blog/cuanto-vale-mi-piso.jpg # Archivo en src/assets/blog/. Barcelona real, luz natural; licencia comprobada.
imageAlt: Fachada modernista con balcones en el Eixample # Describe lo que se ve (accesibilidad).

# ── Control editorial y legal ─────────────────────────────────────────────
status: borrador # borrador → revisado → aprobado → publicado (ver flujo-editorial.md)
reviewedAt: # AAAA-MM-DD de la revisión editorial. Obligatoria desde «aprobado».
legalFiscal: true # true si el texto afirma algo legal, fiscal o económico (impuestos, plazos, normas, cifras de mercado…).
legalReview: pendiente # no_aplica (solo si legalFiscal: false) | pendiente | aprobada (solo tras auditoría APTO)
sources: # Obligatorias si legalFiscal: true. Fuentes primarias (BOE, DOGC, AEAT, ATC, Ajuntament, Idescat…).
  - label: Portal de Dades, Ajuntament de Barcelona
    url: https://portaldades.ajuntament.barcelona.cat/ # https obligatorio
    checkedAt: 2026-11-20 # Día en que se LEYÓ la fuente (no el día en que se localizó).
---

Respuesta directa a la búsqueda en las dos primeras frases, con la palabra clave tal cual: cuánto vale mi piso
en Barcelona depende de… Cierra la introducción con un [servicio relacionado](/es/servicios/valoracion).

## ¿Primera pregunta del lector?

Un H2 por duda principal, redactado como la pregunta que haría el propietario. Respuesta concreta primero,
matiz después. Enlaza donde aporte, no por rellenar: [los barrios](/es/zonas/barcelona).

### Subapartado (solo si hace falta)

Los niveles no se saltan: H2 → H3 → H4. Nunca un H1 en el texto.

## ¿Segunda pregunta?

Cifras de mercado solo de la colección oficial: «4.254 €/m²» debe existir en `src/content/market`.
Si no está, no se cita en euros por m² ni por mes: se describe sin cifra.

## ¿Y en mi caso concreto?

Cierre útil que lleve a la acción natural del artículo (sin promesas): [vender tu vivienda](/es/servicios/venta-estrategica).
```

## Qué pinta la web sola (no lo escribas en el texto)

- Titular, categoría, fechas («Actualizado el…» si hay `updatedAt`), tiempo de lectura (palabras ÷ 200).
- Índice «En este artículo» (si hay 3 o más H2).
- Lista **Fuentes** con enlace y fecha de comprobación (desde `sources`).
- Bloque de **llamada a la acción** al final (desde `cta`).
- Datos estructurados `Article` (autor/editor = HousySpace; `dateModified` solo con `updatedAt`).

## Reglas de enlaces (las comprueba `blog:check`)

- Mínimo 2 enlaces internos, al menos 1 a un servicio (`/es/servicios/...`).
- Rutas completas del idioma del artículo (`/es/...`), sin dominio ni `index.html`, solo páginas reales:
  servicios, valoración, contacto, zonas (Barcelona, distritos y barrios de la colección de mercado) y otros artículos que existan.
- Fuentes externas: solo en `sources` o como enlace contextual; siempre `https`.

## Frases que no puede llevar el texto

«rentabilidad asegurada», «garantizado/a», «sin riesgo», «el mejor precio», «precio garantizado» (y sus
equivalentes en en/it/ca). La lista vive en `src/features/blog/domain/bannedClaims.ts`.
