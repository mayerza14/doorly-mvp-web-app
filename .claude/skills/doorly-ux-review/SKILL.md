---
name: doorly-ux-review
description: Use this skill before making any visual or UX change in Doorly. It documents the screen, the problem, the proposed change, and the impact before editing anything.
---
 
# Doorly UX Review Skill
 
Cuando el usuario quiera cambiar algo visual o de experiencia de usuario, no editar de inmediato.
 
Primero trabajar las siguientes secciones:
 
---
 
## 1. Pantalla o componente afectado
Identificar exactamente qué pantalla, sección o componente se quiere cambiar.
Listar los archivos relevantes después de inspeccionarlos.
 
## 2. Problema de UX actual
Describir qué está mal o qué fricción genera la experiencia actual.
Si el usuario no lo describió, preguntarlo antes de continuar.
 
## 3. Cambio propuesto
Describir el cambio visual o de flujo de manera concreta.
Incluir:
- Qué se agrega, quita o modifica.
- Cómo queda el flujo después del cambio.
## 4. Impacto mobile
Verificar si el cambio afecta la experiencia en mobile.
Doorly es mobile-first. Cualquier cambio visual debe funcionar bien en pantallas chicas.
 
## 5. Copy afectado
Si el cambio incluye textos de interfaz:
- Proponer el copy en español.
- Mantener el tono claro, simple y confiable de Doorly.
- No usar anglicismos innecesarios.
## 6. Archivos afectados
Listar los archivos o componentes a modificar.
No listar archivos sin haberlos inspeccionado.
 
## 7. Riesgos
¿El cambio puede romper algo más? ¿Afecta flujos de reserva, pago, auth o admin?
Si toca una zona sensible, marcarlo explícitamente.
 
## 8. Validación
Pasos mínimos para confirmar que el cambio visual funciona:
- [ ] Se ve correctamente en mobile
- [ ] Se ve correctamente en desktop
- [ ] No rompe el flujo de la pantalla
- [ ] lint
- [ ] build
---
 
No editar ningún archivo hasta que el usuario apruebe el cambio propuesto.
 
Aprobación explícita = el usuario dice "ok", "adelante", "hacelo", "dale" o similar con intención clara de avanzar.
"Suena bien" o "interesante" no cuenta como aprobación.