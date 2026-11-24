# Cabecera

Cabecera fija de todas las páginas: logo, menú con submenús (Propiedades, Servicios, Vivir en Barcelona, Nosotros, Contacto) y acceso a contacto.

- **Dónde está en la web:** `/nosotros/` (`header#hdr`).
- **Hojas de estilo:** `site.css`, `v2.css`, `v3.css`, `nosotros.css` (copias en `css/` de este sistema).
- **Qué aporta quien lo use:** los enlaces del menú y sus submenús; la página activa.
- **Notas:** Tiene dos estados: transparente con tema oscuro mientras está sobre la foto o el vídeo de portada, y sólida (`.solid`, fondo `glass`) en el resto. Alto `cabecera-alto` (92 px) en escritorio y `cabecera-alto-movil` (76 px) en móvil. En móvil el menú es un panel desplegable (`.mnav`). En la vista se muestra sólida y sin fijar.

La vista es una copia estática del marcado real de la página a 1440 px, sin JavaScript: lo que se mueve (carruseles, menús, mapas, contadores) aparece en su estado inicial.
