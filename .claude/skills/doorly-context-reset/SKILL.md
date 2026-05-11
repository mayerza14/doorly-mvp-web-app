---
name: doorly-context-reset
description: Use this skill to start a new Claude Code chat with full Doorly context without re-explaining everything manually.
---
 
# Doorly Context Reset Skill
 
Usar este skill al inicio de un chat nuevo en Claude Code, cuando el contexto anterior se perdió o el chat anterior se volvió muy largo.
 
---
 
## Instrucción para Claude
 
Al activar este skill, hacer lo siguiente en orden:
 
### 1. Leer CLAUDE.md
Leer el archivo `CLAUDE.md` en la raíz del proyecto.
Confirmar que lo leíste con un resumen de 4-5 líneas que cubra:
- Qué es Doorly
- Stack técnico
- Zonas sensibles
- Regla principal de trabajo (plan antes de editar)
### 2. Confirmar estructura del proyecto
Listar las carpetas principales del repo sin leer archivos individuales todavía.
Solo la estructura de primer nivel es suficiente.
 
### 3. Confirmar skills disponibles
Listar las skills disponibles en `.claude/skills/` sin leerlas todas.
Solo los nombres y una línea de descripción de cada una.
 
### 4. Preguntar por la tarea
Una vez confirmado el contexto, preguntar:
"¿En qué tarea arrancamos?"
 
No empezar ninguna tarea, no leer más archivos, y no hacer cambios hasta que el usuario describa qué quiere hacer.
 
---
 
## Prompt sugerido para el usuario
 
Podés arrancar un chat nuevo pegando esto:
 
```
Leé el CLAUDE.md y confirmame que entendiste el proyecto.
Después listá la estructura de carpetas y las skills disponibles.
No edites nada. Cuando termines, preguntame en qué arrancamos.
```
 
---
 
Este skill no consume contexto innecesario. Solo lee lo mínimo para orientarse y espera instrucciones.