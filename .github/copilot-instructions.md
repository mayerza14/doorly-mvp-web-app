# Doorly — instrucciones globales v2

## Producto
Doorly es un marketplace argentino que conecta personas y empresas que necesitan guardar o estacionar bienes con personas que tienen espacios privados disponibles.

## Regla central de negocio
- Doorly es intermediario. No es propietario, depositario ni operador logístico.
- Doorly no ofrece estacionamiento en vía pública.
- La dirección exacta y otros datos sensibles del espacio no deben exponerse fuera del momento correcto del flujo.
- El producto debe transmitir confianza, claridad, cercanía y profesionalismo.

## Estado real del producto
Doorly no es solo un prototipo.
Según el contexto del usuario, hoy existen flujos reales y en uso para:
- login con Google
- pagos con Mercado Pago
- backend con Supabase
- chat entre usuarios
- reviews
- mapa
- emails
- flujo admin de revisión, devolución para corrección, aprobación, rechazo y certificación del espacio

Importante:
- Si el código local parece mockeado, simplificado o desactualizado, distinguir siempre entre:
  1. implementación actual del repositorio
  2. comportamiento real/productivo esperado
- No asumir que el código actual refleja todo el estado real del producto.

## Prioridad principal
La prioridad actual del usuario es:
1. que todo funcione bien
2. mejorar UX mobile
3. hacer cambios puntuales, no rediseños generales

Toda propuesta visual debe priorizar usabilidad en celular:
- jerarquía clara de CTA
- botones importantes visibles
- evitar superposiciones
- spacing y lectura correctos
- navegación cómoda en mobile

## Regla operativa clave
No editar nada por iniciativa propia.
Por defecto:
- primero analizar
- después planificar
- solo editar si el usuario lo pide explícitamente

## Zonas sensibles / prohibidas salvo pedido explícito
No tocar sin instrucción específica del usuario:
- auth
- guards
- pagos
- reservas
- admin
- lógica de aprobación/certificación
- datos sensibles
- disponibilidad
- mapa
- emails
- endpoints API
- reglas de exposición de datos privados

## Estilo de trabajo
- Hacer cambios mínimos, localizados y fáciles de revertir
- No mezclar refactor con cambio visual si no hace falta
- No introducir dependencias nuevas sin necesidad fuerte
- No mover carpetas o archivos sin motivo claro
- Mantener consistencia visual y responsive
- Preservar la arquitectura actual salvo pedido explícito

## Regla de verificación
Antes de editar, explicar:
1. qué pasa hoy en el código
2. qué entiende como objetivo del usuario
3. qué archivos tocaría
4. riesgos y efectos colaterales
5. propuesta de cambio mínimo

## Regla sobre inferencias
Cuando describas algo del proyecto, diferenciá siempre una de estas dos:
- “Esto está implementado actualmente en el código”
- “Esto parece una intención, una inferencia o una expectativa del producto, no una implementación confirmada”

## Tono y copy
- Español natural para Argentina
- startup, pero con tono humano, claro, confiable y profesional
- evitar tono robótico
- no inventar claims ni promesas que el producto no soporte hoy
- preservar vocabulario y estructura existentes salvo pedido del usuario

## Tipos de cambios más probables en esta etapa
- optimizar visualmente para telefonos
- hacer más visibles los botones importantes
- resaltar “Publicar espacio”
- corregir superposiciones visuales
- mejorar carga y requisitos de fotos
- revisar errores concretos del panel admin
- hacer la home menos plana visualmente sin romper la identidad actual

## Al terminar cualquier cambio
- resumir archivos tocados
- explicar qué cambió
- indicar cómo probarlo
- mencionar límites o riesgos pendientes