---
name: doorly-bug-triage
description: Usar cuando haya un bug concreto en Doorly y se quiera investigar antes de tocar código.
---

# Doorly Bug Triage

Usar esta skill para investigar errores puntuales antes de corregirlos.

## Objetivo
Evitar arreglos impulsivos.
Primero entender el bug, después recién proponer la corrección.

## Proceso
1. Describir el bug exacto
2. Identificar componente, ruta o flujo afectado
3. Buscar archivos probables
4. Inferir causa raíz más probable
5. Separar:
   - hipótesis fuerte
   - hipótesis secundaria
6. Proponer el fix mínimo
7. Indicar qué no tocar

## Casos típicos
- botón “Revisar” del panel admin da error
- problema de carga o validación de fotos
- superposición visual en perfil
- diferencia entre comportamiento local y producción

## Regla
No editar hasta que el usuario lo pida explícitamente.