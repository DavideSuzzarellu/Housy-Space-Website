# InmueblesVendidos

«Inmuebles intermediados y vendidos»: mapa con los 95 inmuebles en racimos, filtros por distrito y listado.

- **Dónde está en la web:** `/propiedades/` (`section#pisos-vendidos`).
- **Hojas de estilo:** `site.css`, `v2.css`, `v3.css`, `valoracion-pop.css`, `pisos-vendidos.css`, `leaflet.css`, `MarkerCluster.css` (copias en `css/` de este sistema).
- **Qué aporta quien lo use:** los datos de assets/js/data-vendidos.js (posiciones por barrio, provisionales).
- **Notas:** El mapa es Leaflet con teselas propias (assets/img/mapa/bcn-z14.jpg y bcn-z15.jpg); en la vista sale sin JavaScript.

La vista es una copia estática del marcado real de la página a 1440 px, sin JavaScript: lo que se mueve (carruseles, menús, mapas, contadores) aparece en su estado inicial.
