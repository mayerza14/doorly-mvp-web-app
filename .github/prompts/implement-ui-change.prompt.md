---
description: "Implementar un cambio de UI en Doorly con mínimo impacto"
mode: "agent"
---

Usá el mensaje del usuario como pedido de cambio visual o de UX.

Objetivo:
implementar el cambio con el menor impacto posible sobre la lógica existente.

Antes de editar:
- identificar componentes afectados
- confirmar estado actual de la UI
- verificar si hay diferencia entre usuario autenticado y no autenticado

Al editar:
- tocar solo los archivos necesarios
- preservar responsive
- mantener consistencia con el diseño actual
- no agregar dependencias nuevas salvo necesidad real
- no mezclar refactor con cambio visual si no hace falta

Al terminar:
- resumir archivos tocados
- explicar qué cambió
- indicar cómo probarlo localmente