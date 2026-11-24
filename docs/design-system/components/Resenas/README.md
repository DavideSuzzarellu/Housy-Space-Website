# Resenas

Reseñas de clientes en bloque oscuro, con avatar redondo y estrellas.

- **Dónde está en la web:** `/` (`section#resenas`).
- **Hojas de estilo:** `site.css`, `v2.css`, `v3.css`, `home-intro.css`, `acordeon5.css` (copias en `css/` de este sistema).
- **Qué aporta quien lo use:** las reseñas (nombre, texto, puntuación).
- **Notas:** Diseñado para las reseñas de Google (Places API New) a través de un endpoint de servidor (`data-endpoint`, ver assets/js/resenas.js). Sin endpoint, como hoy, muestra tarjetas esqueleto y valoración «—»: es lo que se ve en la vista.

La vista es una copia estática del marcado real de la página a 1440 px, sin JavaScript: lo que se mueve (carruseles, menús, mapas, contadores) aparece en su estado inicial.
