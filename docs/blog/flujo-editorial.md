# Flujo editorial del blog

Cómo llega un artículo a la web, quién hace cada paso y qué lo bloquea. Resume las fases de las skills del
cliente (`housyspace-seo` §14, `housyspace-content-automation` §3 y §12, `housyspace-legal-tax-auditor`) sobre
el modelo de contenido de la web (`src/features/blog`).

> **Nada se publica solo.** Claude redacta y prepara; **solo una persona aprueba** (Davide Oggiano), y esa
> aprobación vale para **una versión concreta**: `articleId` + commit de git. Si el texto cambia, hay que
> aprobar de nuevo. El silencio no es aprobación.

## Estados del artículo (`status`)

| `status`    | Significa                                                                                  | Sale en la web |
| ----------- | ------------------------------------------------------------------------------------------ | -------------- |
| `borrador`  | Redactado o en redacción. Auditoría legal-fiscal pendiente o con correcciones.             | No             |
| `revisado`  | Auditoría legal-fiscal APTA (o no aplica) y revisión editorial hecha; falta la aprobación. | No             |
| `aprobado`  | Davide aprobó esta versión (`reviewedAt` obligatoria).                                     | No             |
| `publicado` | Aprobado y con fecha. Sale cuando `date` ≤ hoy en la primera reconstrucción.               | Sí             |

Equivalencias con los estados de `housyspace-content-automation` §4: Idea propuesta / Investigación (aún no hay
archivo) · Borrador y Correcciones solicitadas → `borrador` · Pendiente de revisión → `revisado` ·
Aprobado → `aprobado` · Programado y Publicado → `publicado` (con fecha futura = programado; pasada = publicado).

## Fases y puertas

| #   | Fase                             | Quién / qué                                                                                                                                         | Resultado                                                                    | Puerta (qué lo bloquea)                                              |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Investigación                    | Claude (`housyspace-seo`): intención, competencia, fuentes. Lee `inventario-articulos.md` (cannibalización).                                        | Ficha SEO (palabra clave, intención, grupo, fuentes)                         | La palabra clave ya existe en el inventario → otro tema              |
| 2   | Propuesta de enfoque             | Claude presenta la ficha; **Davide da el visto bueno al enfoque**                                                                                   | Enfoque aprobado (en el issue o en el chat)                                  | Sin visto bueno no se redacta (salvo que lo pida expresamente)       |
| 3   | Redacción                        | Claude (`housyspace-seo` + `housyspace-marca`) crea `src/content/blog/<slug>.md` con `plantilla-articulo.md` en una rama y abre un **pull request** | Archivo con `status: borrador`, `legalReview: pendiente` si `legalFiscal`    | La CI (`blog-check`, tests, `astro check`) debe pasar                |
| 4   | Auditoría legal-fiscal           | Claude (`housyspace-legal-tax-auditor`) si `legalFiscal: true`; si no, comprobación básica                                                          | Informe APTO / REQUIERE CORRECCIONES / NO APTO ligado a `articleId` + commit | REQUIERE CORRECCIONES o NO APTO → sigue en `borrador`; no avanza     |
| 5   | Revisión editorial               | Claude corrige y repasa; con APTO pone `legalReview: aprobada` y `status: revisado`                                                                 | PR actualizado, CI verde                                                     | Cualquier error de `blog:check` (los avisos se revisan, no bloquean) |
| 6   | Vista previa                     | El PR se compila y se revisa en preview (maquetación a 1440 y 390 px)                                                                               | Enlace a la vista previa en el PR                                            | El revisor no ve la versión final                                    |
| 7   | **Aprobación de Davide Oggiano** | Davide, expresamente, **de una versión**: comentario en el PR «Aprobado `HS-AAAA-MM-NN` @ `<commit>`»                                               | `status: aprobado`, `reviewedAt` = fecha de la aprobación                    | Sin aprobación expresa el PR no se fusiona                           |
| 8   | Programación                     | Claude, en un último commit **solo de cabecera** (`status: publicado`, `date` futura)                                                               | PR listo para fusionar                                                       | Cualquier cambio de texto tras la aprobación invalida la aprobación  |
| 9   | Fusión                           | Una persona fusiona el PR (nunca Claude por su cuenta)                                                                                              | El artículo está en `main` con fecha futura                                  | —                                                                    |
| 10  | Publicación                      | La reconstrucción diaria de la web (job programado, fuera de esta fase)                                                                             | El artículo aparece cuando `date` ≤ hoy y entra en el sitemap                | `status` ≠ `publicado` o fecha futura → no aparece                   |

### Aprobación ligada a una versión

- La versión aprobada es el contenido en el commit `X` del PR. Se escribe en el comentario de aprobación:
  `Aprobado HS-2026-11-01 @ 3ac8fdc`.
- Tras la aprobación solo pueden cambiar estos campos de cabecera: `status`, `date`, `reviewedAt`. Cualquier otro
  cambio (texto, título, fuentes, enlaces, cifras, imagen) deja la aprobación sin efecto: el artículo vuelve a
  `revisado` y se pide una aprobación nueva sobre el commit nuevo.
- Revisión de esto en el PR: `git diff X..HEAD -- src/content/blog/<slug>.md` debe mostrar solo esas líneas.
  (Fase siguiente: automatizarlo en CI. Hoy es una comprobación humana del revisor.)
- Recomendado en GitHub: proteger `main` exigiendo la revisión de Davide en los cambios de `src/content/blog/**`.

### Actualizar un artículo ya publicado

Cambiar el texto o los datos legales/fiscales vuelve a pasar por las fases 4-8. `updatedAt` solo se rellena
cuando de verdad se ha revisado y actualizado (la web lo muestra y lo manda a Google como `dateModified`).

## Lo que Claude debe rellenar en cada artículo

| Campo                | Obligatorio                    | Cómo                                                                                                   |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `title`              | Sí                             | H1 con la palabra clave; ≤ 60 caracteres si no hay `seoTitle`                                          |
| `seoTitle`           | No                             | ≤ 60 caracteres; solo si el H1 es más largo                                                            |
| `description`        | Sí (140-155 si no es borrador) | Respuesta + gancho; sin promesas                                                                       |
| `date`               | Sí                             | Fecha de publicación prevista (futura = programado)                                                    |
| `articleId`          | Sí                             | `HS-AAAA-MM-NN` siguiente libre (ver el inventario)                                                    |
| `status`             | Sí (defecto `borrador`)        | Ver tabla de estados; **nunca `publicado` sin la aprobación de la fase 7**                             |
| `keyword`            | Sí                             | Una sola por artículo; en el título y en las 100 primeras palabras                                     |
| `intent`             | Sí                             | `informacional` · `comercial` · `transaccional`                                                        |
| `secondaryKeywords`  | No                             | Lista corta                                                                                            |
| `cluster` / `pillar` | Sí / No                        | A, B, C o D; `pillar: true` solo en el artículo principal del grupo                                    |
| `category`           | Sí                             | `valoracion`, `venta`, `gastos-impuestos`, `herencias`, `contratos-documentacion`, `mercado-barcelona` |
| `cta`                | Sí                             | `valoracion`, `venta` o `consulta`                                                                     |
| `language`           | Sí                             | Idioma del texto                                                                                       |
| `image`, `imageAlt`  | Sí                             | Archivo en `src/assets/blog/`; licencia comprobada y anotada en el PR                                  |
| `legalFiscal`        | Sí                             | `true` ante cualquier afirmación legal, fiscal o económica; ante la duda, `true`                       |
| `legalReview`        | Sí si `legalFiscal`            | `pendiente` hasta el APTO; después `aprobada`. `no_aplica` solo si `legalFiscal: false`                |
| `sources`            | Sí si `legalFiscal`            | `label`, `url` https, `checkedAt` = día en que se **leyó** la fuente                                   |
| `reviewedAt`         | Desde `aprobado`               | Fecha de la revisión editorial / aprobación                                                            |
| `updatedAt`          | No                             | Solo con actualización real                                                                            |
| `author`             | No                             | Vacío = HousySpace                                                                                     |

## Comprobaciones automáticas

- Local: `bun run blog:check` (tabla; sale con 1 si hay errores). Los mismos controles corren como test (`bun run test`).
- En cada pull request que toque `src/content/blog/**`, `src/content/market/**`, `src/features/blog/**` o
  `docs/blog/**`: `.github/workflows/blog-check.yml` (`blog:check`, `test`, `check`).
- Inventario: `bun run blog:inventory` regenera `inventario-articulos.md` desde la colección. Se regenera y se
  incluye en el PR cuando hay un artículo nuevo; no se edita a mano.

Las comprobaciones **no sustituyen** la auditoría legal-fiscal ni la aprobación: detectan lo mecánico
(duplicados, enlaces rotos, cifras que no son de la colección de mercado, promesas prohibidas, fuentes ausentes).
