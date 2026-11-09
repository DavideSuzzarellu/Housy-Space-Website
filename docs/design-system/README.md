HousySpace Property Solutions son consultores inmobiliarios en Barcelona: asesoran si vender o comprar, cómo y cuándo, y acompañan al cliente en cada paso. La web es sobria y editorial: papel claro, verde petróleo, un turquesa de acento y una sola familia tipográfica, Montserrat, siempre en mayúsculas.

## Contenido y tono

- Trata al cliente de tú: «Te asesoramos», «tu vivienda», «Cuéntanos qué buscas».
- Preséntate como consultores inmobiliarios, no como agencia: «Consultores inmobiliarios, no solo vendedores». Nunca escribas «agencia pequeña».
- Frases fijas, tal cual: «No te preocupes, yo me encargo» (siempre «yo», nunca «nos encargamos») y «UNA MILLA EXTRA» (nunca «una milla más»).
- «Los mejores» solo aparece en dos frases: «Rodearnos de los mejores también forma parte de nuestra filosofía.» y «Nos rodeamos de los mejores para ofrecerte mucho más.»
- Cifras siempre redondeadas con «más de»: «+35 M€ intermediados», «+100 inmuebles», «+10 municipios», «9 años en el sector», «5 años de HousySpace».
- Sin emoji y sin cursiva.
- Sin punto final en los titulares y sin rótulos numerados («01 /») encima.
- Botones con verbo claro: «Conócenos», «Enviar consulta», «Ver el mapa aquí».

## Mayúsculas

Todo el texto de la web se ve en mayúsculas. El HTML se escribe en minúsculas normales y las mayúsculas las pone el CSS (`text-transform: uppercase`), para que los lectores de pantalla y Google lean frases normales. Los titulares (`h1`–`h4`, `.sh`) suman `letter-spacing: .03em`.

## Color

- La página es papel claro: fondo `c-bg`, secciones alternas en `c-bg-alt` (clases `.bg-a` y `.bg-b`), texto `c-text` y texto secundario `c-text-2`.
- Los componentes no usan esos colores directamente sino los papeles `bg`, `bg-alt`, `card`, `fg`, `muted`, `line`, que cambian solos dentro de un bloque oscuro.
- Bloques oscuros: portada con vídeo, cabeceras con foto, valoración, reseñas, pie y menú móvil usan el tema «Bloque oscuro» (`c-bg-dark` #162b2a). En las vistas de este sistema llevan `data-theme="dark"`; en la web actual son una lista de clases en `site.css` (`.hero`, `.val`, `#resenas`, `footer.ftr`…).
- `accent` (#21cec5) es el turquesa del logo: úsalo como relleno, filete, foco o texto sobre bloque oscuro. Sobre papel claro no sirve para texto (1,9:1): ahí el texto turquesa es `accent-tx`.
- `petrol` es el verde de marca para perímetros y fondos de acento; texto encima en blanco o `c-bg`.
- Estados: `ok`, `ko`, `warn`, `err`, siempre con palabra o icono además del color.
- Gráficos y mapas: series `ch-a` (turquesa), `ch-b` (cálida), `ch-c`, rejilla `ch-grid`, ejes `ch-ax`.
- Contraste comprobado: `c-text` 14,3:1, `accent-tx` 5,2:1 y `c-text-2` 4,9:1 sobre `c-bg`. Avisos del propio código: `c-text-2` sobre `bg-deep` (4,2:1), `taupe-tx` sobre `c-bg` (4,1:1) y `accent-2` (3,9:1) solo valen para texto de 24 px o más.

## Tipografía

- Una sola familia: Montserrat (Google Fonts, variable de 400 a 900), cargada con `https://fonts.googleapis.com/css2?family=Montserrat:wght@400..900&display=swap`.
- Los titulares usan «Montserrat Titulares»: la misma Montserrat declarada con `size-adjust: 81.9%` en `site.css`. Por eso un titular de 92 px en el CSS se ve como unos 75 px. Si tu sistema no admite `size-adjust`, multiplica los tamaños de la familia `titulares` por 0,819.
- Titulares en 800 o 900 (`presentacion-h1`, `cabecera-h1`, `seccion-h2`, `pagina-h1`, `h2`), subtítulos en 700 (`h3`, `h3-s`), texto en 400 (`cuerpo` = 14 px / 1,7), botones en 500 con espaciado ancho (`boton`, `boton-s`), rótulos en 700 con espaciado muy ancho (`rotulo`).
- 10 px es el tamaño mínimo de toda la web (`legal`, `pie-enlace`).
- Los tamaños de los estilos están medidos a 1440 px de ancho; varios titulares en el CSS son `clamp()` y bajan en móvil.

## Espacios, rejilla y formas

- Contenedor `.wrap`: máximo `wrap-max` (1120 px) con `wrap-pad` (22 px) a cada lado.
- Secciones `.sec`: relleno vertical `seccion-y` (76 px), `seccion-y-movil` (54 px) por debajo de 760 px. El corte de móvil es 760 px.
- Cabecera de `cabecera-alto` (92 px) en escritorio y `cabecera-alto-movil` (76 px) en móvil; el anclaje de enlaces deja ese hueco (`scroll-padding-top`).
- Esquinas rectas por defecto (`radius-0`) en botones, tarjetas, fotos y campos. `radius-4` solo en ventanas emergentes y cajas; `radius-20` solo en las tarjetas de distrito; `radius-full` para círculos.
- Casi sin sombras: la separación la hacen los fondos alternos y los filetes `line`. Sombras solo en ventanas emergentes (`sombra-ventana`), hojas sobre oscuro (`sombra-ficha`) y el botón de filosofía (`sombra-boton`).
- Foco de teclado visible en todo: contorno de 2 px en `accent` separado 3 px.

## Imágenes e ilustraciones

- Fotos reales de Barcelona y de arquitectura (fachadas modernistas, balcones, interiores); las de los distritos son de Shutterstock con licencia estándar.
- Ilustraciones propias con fondo transparente para servicios (`assets/Ilustraciones/cine-*` en el carrusel, `ill-*` en las cabeceras de servicio) y para Nosotros (`ill-*-640`). Si una ilustración se generó con IA, el pie lo dice: «Imagen conceptual generada con IA».

## Logos y sellos

- `logo.svg` / `logo-oscuro.svg` sobre papel claro; `logo-blanco.svg` sobre bloques oscuros y fotos. El isotipo (`isotipo.svg`, `isotipo-blanco.svg`) va solo en espacios pequeños; `pin-housyspace.svg` es el pin del mapa y de la valoración.
- En el pie: AICAT solo con su logo; APEI con su logo y «Experto nº 3261» debajo.

## Iconos

Iconos de trazo en SVG en línea: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2.2"`, extremos y uniones redondeados, `aria-hidden="true"`. Toman el color del texto. Nada de emoji ni de fuentes de iconos.

## Componentes

Cada componente de este sistema es una sección real de la web, copiada de su marcado a 1440 px y pintada con las hojas de estilo de la web (`css/`). Sirven de referencia exacta para reconstruirlos: miden lo mismo, usan las mismas clases y los mismos textos.

## No sincronizado

- Fuente: repositorio HOUSYSPACE-PS/housyspace-web, rama main, commit ef59e52 (9/11/2026).
- Componentes por la vía de solo lectura: la web no tiene librería de componentes (HTML, CSS y JavaScript sin framework), así que no hay `bundle.js`; cada vista es estática y sin JavaScript (carruseles, menús, mapas, contadores y el valorador de Lystos no se mueven).
- No pasados a tokens: los `clamp()` de tamaños, las variables locales de componentes (`--logo-big`, `--cx`, `--t`…) y los bloques oscuros secundarios de `v2.css` y `v3.css`, que repiten valores del tema oscuro.
- Sin archivos de fuente: Montserrat se sirve desde Google Fonts.
