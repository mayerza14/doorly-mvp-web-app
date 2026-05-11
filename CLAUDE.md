# Doorly — Project Instructions for Claude Code
 
> Last updated: 2025-07
 
---
 
## TL;DR — Leé esto primero
 
- Doorly es un marketplace argentino de espacios privados (cocheras, depósitos, bauleras, etc.).
- Stack: Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Mercado Pago + Mapbox.
- **Antes de editar cualquier cosa: explicá el plan y esperá aprobación explícita.**
- Zonas sensibles: auth, pagos, reservas, privacidad de direcciones, admin, RLS, webhooks.
- Respondé siempre en castellano. Código y nombres técnicos pueden quedar en inglés.
---
 
## Contexto del producto
 
Doorly conecta dueños de espacios privados ociosos con personas que necesitan guardar cosas o estacionar vehículos. Ejemplos: cocheras, bauleras, depósitos, galpones, terrenos, playones. Objetos: autos, motos, muebles, cajas, stock de e-commerce, trailers, motorhomes, embarcaciones.
 
Doorly es intermediario. No es dueño de espacios, no opera estacionamiento en vía pública y no actúa como depositario de bienes.
 
El producto está pensado para el mercado argentino. Usar copy en español salvo que el código existente use inglés por razones técnicas claras.
 
---
 
## Reglas del negocio
 
- Login exclusivamente con Google.
- Pagos únicamente con Mercado Pago.
- Una reserva se confirma **sólo** cuando Mercado Pago notifica a Supabase que el pago fue aprobado.
- La dirección exacta y privada se muestra **sólo** después del pago confirmado.
- Las publicaciones pasan por revisión manual del admin antes de aprobarse.
- El admin puede: aprobar, rechazar, devolver para corrección, pausar, eliminar, o marcar como espacio certificado.
- El propietario puede: pausar/reactivar o eliminar su propia publicación.
- Soporte por email. No usar WhatsApp como canal de soporte en producción.
- Chat post-pago habilitado sólo después de reserva confirmada.
- Reviews mutuas al finalizar la reserva: ventana de 14 días, comentario obligatorio.
---
 
## Stack técnico
 
- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend/DB:** Supabase (Auth, DB, RLS, Storage, Edge Functions)
- **Pagos:** Mercado Pago
- **Mapas:** Mapbox
- **Deploy:** Vercel + GitHub
---
 
## Zonas sensibles — no tocar sin aprobación explícita
 
### Archivos y carpetas críticos
- `app/api/webhooks/` — webhooks de Mercado Pago
- `app/api/auth/` — lógica de autenticación
- `supabase/migrations/` — migraciones de base de datos
- `lib/auth/` — guards y helpers de auth
- `lib/payments/` o equivalente — lógica de pagos
- `.env`, `.env.local`, `.env.*` — variables de entorno (nunca leer ni modificar)
### Conceptos sensibles
- RLS policies en Supabase
- Visibilidad de dirección exacta
- Flujo de confirmación de reserva
- Permisos del admin
- Acceso al chat post-pago
---
 
## Skills disponibles — cuándo usarlas
 
| Situación | Skill a usar |
|---|---|
| Antes de implementar una funcionalidad nueva | `doorly-feature-plan` |
| Cuando el cambio puede afectar Supabase (tablas, RLS, migraciones) | `doorly-supabase-change` |
 
---
 
## Reglas de seguridad antes de editar
 
1. Explicar qué entendiste de la tarea.
2. Identificar los archivos relevantes (sólo los necesarios).
3. Indicar si el cambio afecta: frontend, Supabase, pagos, reservas, admin, auth, o privacidad.
4. Proponer un plan mínimo de implementación.
5. **Esperar aprobación antes de editar.**
**Aprobación explícita** = el usuario dice "ok", "adelante", "hacelo", "dale" o similar con intención clara de avanzar.
"Suena bien" o "interesante" **no** cuenta como aprobación.
 
No hacer refactors amplios salvo que se pidan explícitamente.
 
No inventar columnas, tablas, rutas o variables de entorno. Inspeccionar el código primero.
 
No exponer claves, variables de entorno, direcciones privadas ni datos de usuarios.
 
No modificar lógica de pagos, guards de auth, RLS, permisos de admin ni visibilidad de direcciones sin explicar el riesgo primero.
 
---
 
## Estándares de código
 
- Cambios mínimos y acotados. No tocar lo que no es necesario.
- Mantener la arquitectura y convenciones de nombres existentes.
- TypeScript con tipado seguro. Evitar `any` salvo que sea inevitable y justificado.
- Preservar UX mobile-first.
- Copy en español: claro, simple y confiable.
- Después de cada cambio, sugerir la validación mínima relevante: lint, typecheck, build o path de test manual.
---
 
## Idioma
 
- Responder siempre en castellano, salvo que el usuario pida inglés explícitamente.
- Copy de UX en español.
- Nombres técnicos, comandos, identificadores de código, campos de base de datos y conceptos de frameworks pueden quedar en inglés.
---
 
## Disciplina de tokens y contexto
 
- No leer todo el codebase salvo que sea estrictamente necesario.
- Inspeccionar primero sólo los archivos directamente relevantes.
- Respuestas concisas salvo que se pida más detalle.
- Preferir cambios acotados sobre refactors amplios.
- No repetir contexto del proyecto si no hace falta.
- Si la conversación se vuelve muy larga, resumir antes de continuar.
- Si el contexto se vuelve demasiado grande, sugerir abrir un chat nuevo con un resumen compacto.
---
 
## Estilo de respuesta
 
- Siempre en castellano.
- Claro, directo y conciso.
- No explicar de más salvo que se pida.
- Antes de editar: resumir el plan y esperar aprobación.
---
 
## Workflow general
 
Para cualquier funcionalidad no trivial, usar Plan Mode primero.
 
Cuando una funcionalidad puede requerir cambios en Supabase:
1. Identificar el uso actual del schema en el código.
2. Proponer los cambios de base de datos por separado.
3. Proveer SQL o migración para revisión.
4. No asumir acceso a base de datos de producción.
5. No aplicar migraciones sin aprobación explícita.
Ante la duda: preguntar o inspeccionar antes de editar.