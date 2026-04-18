  ---
applyTo: "doorly-app/app/**/*.tsx,doorly-app/components/**/*.tsx,doorly-app/**/*.css"
---

# Reglas para UI, páginas y componentes de Next.js

- Respetar App Router y la estructura actual del proyecto.
- No convertir componentes server a client sin justificarlo.
- Si un componente solo necesita cambios visuales, no tocar su lógica.
- Antes de editar una pantalla, identificar:
  - componente padre
  - componentes hijos afectados
  - rutas impactadas
- Mantener responsive en desktop y mobile.
- Mantener consistencia con el header, footer, botones y espaciados existentes.
- Si se agrega un botón, link o CTA:
  - verificar estado autenticado y no autenticado
  - no duplicar acciones ya presentes en otra parte del mismo bloque
  - no romper el orden visual del navbar o header
- Si el cambio es solo de copy, no tocar clases ni estructura sin necesidad.
- Si aparece una duda entre UX actual y pedido del usuario, priorizar cambio mínimo y explicarlo.