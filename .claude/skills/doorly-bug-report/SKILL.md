---
name: doorly-bug-report
description: Use this skill before investigating or fixing a bug in Doorly. It documents the symptom, reproduces the issue, identifies suspects, and proposes a fix approach before editing anything.
---
 
# Doorly Bug Report Skill
 
When the user reports a bug or unexpected behavior, do not edit immediately.
 
First work through the following sections:
 
---
 
## 1. Síntoma
Describir exactamente qué está pasando:
- Qué ve el usuario vs qué debería ver.
- En qué pantalla o flujo ocurre.
- Qué rol está afectado (seeker, owner, admin, visitante).
## 2. Pasos para reproducir
Listar los pasos mínimos para reproducir el bug.
Si no se puede reproducir con certeza, indicarlo explícitamente.
 
## 3. Archivos sospechosos
Inspeccionar el código e identificar los archivos más probablemente involucrados.
No listar archivos sin haberlos inspeccionado.
 
## 4. Hipótesis de causa
Explicar qué puede estar fallando y por qué.
Si hay más de una hipótesis, listarlas en orden de probabilidad.
 
## 5. Zona de riesgo
Indicar si el bug toca alguna zona sensible:
- Auth
- Pagos / Mercado Pago
- Reservas
- Visibilidad de dirección exacta
- Permisos de admin
- RLS de Supabase
- Chat post-pago
Si toca una zona sensible, marcar el riesgo explícitamente antes de proponer cualquier fix.
 
## 6. Fix propuesto
Describir el cambio mínimo necesario para resolver el bug.
Preferir el cambio más acotado posible.
No proponer refactors aprovechando el bug como excusa.
 
## 7. Riesgo del fix
¿Puede el fix romper algo más? ¿Qué hay que verificar?
 
## 8. Validación
Pasos mínimos para confirmar que el bug está resuelto:
- [ ] Pasos para reproducir ya no generan el error
- [ ] lint
- [ ] typecheck
- [ ] build
- [ ] Casos borde a verificar
---
 
No editar ningún archivo hasta que el usuario apruebe el fix propuesto.
 
Aprobación explícita = el usuario dice "ok", "adelante", "hacelo", "dale" o similar con intención clara de avanzar.
"Suena bien" o "interesante" no cuenta como aprobación.