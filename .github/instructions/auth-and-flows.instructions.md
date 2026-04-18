---
applyTo: "doorly-app/contexts/**/*.tsx,doorly-app/components/*guard*.tsx,doorly-app/components/auth*.tsx,doorly-app/app/login/**,doorly-app/app/register/**,doorly-app/app/profile/**,doorly-app/app/api/users/**,doorly-app/app/api/reservations/**"
---

# Reglas para auth, guards y flujos sensibles

- Tratar auth, reservas y guards como zonas sensibles.
- Antes de editar, identificar:
  - estado actual del login
  - dónde se guarda el usuario
  - cómo se protegen rutas
  - qué pantallas dependen de auth
- No cambiar el flujo de login/logout sin explicar impacto.
- No romper guards de admin o usuario.
- No asumir backend real si la implementación actual es mock o local.
- No reemplazar localStorage, mocks o API routes locales por otra arquitectura sin pedido explícito.
- Si se toca el header o AuthHeader:
  - distinguir claramente usuario autenticado vs no autenticado
  - no confundir estados
  - no proponer botones redundantes
- Si el pedido afecta reserva, visibilidad de datos privados o estado de usuario:
  - explicar primero el efecto colateral
  - proponer la opción más segura