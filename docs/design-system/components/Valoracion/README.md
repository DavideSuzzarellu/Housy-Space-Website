# Valoracion

Bloque «Descubre cuánto vale tu vivienda» con la fachada modernista y el pin del logo; el botón abre el valorador de Lystos en una ventana emergente.

- **Dónde está en la web:** `/` (`section#valoracion`).
- **Hojas de estilo:** `site.css`, `v2.css`, `v3.css`, `home-intro.css`, `acordeon5.css` (copias en `css/` de este sistema).
- **Qué aporta quien lo use:** la imagen (valoracion-fachada-*.webp) y el enlace al valorador.
- **Notas:** El valorador es un iframe externo de Lystos dentro de `.vq-card` (radio `radius-4`, sombra `sombra-ventana`).

La vista es una copia estática del marcado real de la página a 1440 px, sin JavaScript: lo que se mueve (carruseles, menús, mapas, contadores) aparece en su estado inicial.
