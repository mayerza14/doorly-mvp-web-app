# Doorly - Implementación de Autenticación y Gestión

## Rutas Implementadas

### 1. `/auth` - Autenticación
**Estado:** ✅ Completo

**Funcionalidad:**
- Formulario de login con email y contraseña
- Botón "Continuar con Google" para OAuth
- Soporte para `returnUrl` query parameter para redirección post-login
- Redirección automática si el usuario ya está autenticado
- Validación de campos en español
- Estados de carga con spinners

**Características:**
- Mock de autenticación usando localStorage (preparado para Supabase)
- Mensaje informativo sobre el estado MVP
- Diseño responsive con card centrado
- Separador visual entre opciones de login

**TODOs para integración Supabase:**
- `login(email, password)` → `supabase.auth.signInWithPassword()`
- `loginWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Persistencia de sesión con cookies HTTP-only

---

### 2. `/publicar` - Wizard de Publicación
**Estado:** ✅ Completo

**Protección:** Requiere autenticación (redirige a `/auth?returnUrl=/publicar`)

**Wizard de 4 pasos:**

#### Paso 1: Información Básica
- Tipo de espacio (select: Cochera, Garage, Baulera, Depósito, Otro)
- Título (min 10 caracteres)
- Descripción (min 50 caracteres, con contador)
- Zona (input text)
- Dirección completa privada (con disclaimer de privacidad)
- Tamaño en m² (number input)
- Qué entra (badges multi-select: Auto, SUV, Moto, Cajas, etc.)
- Tipo de acceso (24/7 o Horarios coordinados)
- Horarios de acceso (condicional si es "scheduled")

#### Paso 2: Fotos y Reglas
- Uploader de fotos (mínimo 3) - Mock con botón placeholder
- Qué está permitido (checkboxes multi-select)
- Qué NO está permitido (checkboxes multi-select)

#### Paso 3: Precio y Disponibilidad
- Precio diario (required, ARS)
- Precio semanal (optional, ARS)
- Precio mensual (optional, ARS)
- Calendario para agregar rangos de fechas bloqueadas
- Lista de rangos bloqueados con opción de eliminar
- Campo opcional para motivo del bloqueo

#### Paso 4: Revisión y Envío
- Vista completa de todos los datos ingresados
- Secciones agrupadas: Básicos, Fotos y Reglas, Precio y Disponibilidad
- Botón de envío con estado de loading
- Pantalla de éxito con redirección automática a dashboard

**Validación:**
- Validación por paso antes de avanzar
- Mensajes de error en español
- Limpieza de errores al editar campos

**TODOs para integración Supabase:**
- Subir fotos a Supabase Storage
- Crear registro en tabla `listings` con status "pending_review"
- Crear registros en tabla `availability_blocks` para fechas bloqueadas
- Vincular listing con `user.id` como `hostId`

---

### 3. `/dashboard` - Panel de Usuario
**Estado:** ✅ Completo

**Protección:** Requiere autenticación (redirige a `/auth?returnUrl=/dashboard`)

**Tabs basados en rol:**

#### Tab "Mis espacios" (solo para hosts o both)
**Card principal:**
- Botón "Publicar nuevo espacio" en header
- Vista desktop: Tabla con columnas (Título, Tipo, Precio/día, Estado, Acciones)
- Vista mobile: Cards con toda la información
- Badges de estado:
  - Verde "Activo" - listing publicado
  - Amarillo "En revisión" - pending_review
  - Rojo "Suspendido" - suspended
- Acciones por listing:
  - Botón "Ver" → link a `/espacios/[id]`
  - Botón "Editar" → modal placeholder (funcionalidad futura)
- Estado vacío con CTA para publicar primer espacio

**Card de reservas recibidas:**
- Placeholder "Coming soon" con ícono de calendario

#### Tab "Mis reservas" (solo para renters o both)
- Estado vacío con mensaje "No hiciste ninguna reserva"
- Botón CTA "Explorar espacios" → link a `/buscar`

#### Tab "Mensajes" (todos los usuarios)
- Placeholder "Coming soon" con ícono de mensaje

**TODOs para integración Supabase:**
- Query `listings` donde `hostId = user.id`
- Query `bookings` donde `renterId = user.id` o `listing.hostId = user.id`
- Implementar sistema de mensajería en tiempo real

---

## Componentes y Utilidades Creadas

### `/lib/auth-context.tsx`
**AuthContext Provider con:**
- `user: User | null` - Estado del usuario actual
- `isLoading: boolean` - Estado de carga de autenticación
- `login(email, password)` - Login con email/contraseña
- `loginWithGoogle()` - Login con Google OAuth
- `logout()` - Cerrar sesión

**Persistencia:** localStorage con key `doorly_user`

### Navbar actualizado (`/components/navbar.tsx`)
**Cambios:**
- Importa y usa `useAuth()` hook
- Desktop:
  - Si autenticado: Muestra botón "Publicar" + dropdown de usuario con avatar
  - Dropdown incluye: nombre, email, "Mi panel", "Cerrar sesión"
  - Si no autenticado: Muestra botón "Ingresar"
- Mobile (Sheet):
  - Si autenticado: Botones "Publicar", "Mi panel", "Cerrar sesión"
  - Si no autenticado: Botón "Ingresar"

### Layout actualizado (`/app/layout.tsx`)
**Cambios:**
- Wrappea children con `<AuthProvider>`
- Actualizado metadata (title, description en español)
- Lang="es-AR"

---

## Modelos de Datos Actualizados

### Nuevos tipos en `/lib/types.ts`

```typescript
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "renter" | "host" | "both";
  verifiedEmail: boolean;
}
```

### Campos agregados a `Listing`
```typescript
export interface Listing {
  // ... campos existentes
  hostId: string;          // ← NUEVO: ID del usuario dueño
  createdAt: string;       // ← NUEVO: Timestamp ISO
  status: "active" | "pending_review" | "suspended";
}
```

### Mock data actualizado (`/lib/mock-data.ts`)
- Todos los 10 listings tienen `hostId` y `createdAt`
- 5 hosts diferentes (host_1 a host_5)
- Timestamps recientes en enero 2026

---

## Flujos de Usuario Implementados

### Flujo 1: Usuario quiere publicar un espacio
1. Usuario hace click en "Publicar" en navbar
2. Si no está autenticado → redirect a `/auth?returnUrl=/publicar`
3. Usuario se autentica (email o Google)
4. Redirect automático a `/publicar`
5. Completa wizard de 4 pasos con validación
6. Submit exitoso → Pantalla de confirmación
7. Redirect automático a `/dashboard` después de 3 segundos

### Flujo 2: Host revisa sus espacios
1. Usuario autenticado va a `/dashboard`
2. Tab "Mis espacios" muestra tabla/cards de listings
3. Puede ver cada listing en detalle (click en Ver)
4. Puede intentar editar (muestra modal placeholder)
5. Badge de estado indica si está activo/en revisión/suspendido

### Flujo 3: Usuario cierra sesión
1. Click en dropdown de usuario en navbar
2. Click en "Cerrar sesión"
3. Se elimina de localStorage
4. Navbar vuelve a mostrar "Ingresar"
5. Rutas protegidas redirigen a `/auth`

---

## Testing Manual

### Casos de prueba sugeridos:

#### Auth
- [ ] Ingresar con email válido → debe crear usuario mock y guardar en localStorage
- [ ] Ingresar con Google → debe crear usuario mock con email Google
- [ ] Ya autenticado → redirect directo a returnUrl o /dashboard
- [ ] returnUrl en query → debe redirigir correctamente post-login

#### Publicar
- [ ] Acceder sin auth → redirect a /auth?returnUrl=/publicar
- [ ] Paso 1: Validar campos requeridos (min length, selects, etc)
- [ ] Paso 2: Mock upload de fotos → debe agregar 3 placeholders
- [ ] Paso 3: Agregar rango de fechas bloqueadas → debe aparecer en lista
- [ ] Paso 3: Eliminar rango bloqueado → debe desaparecer
- [ ] Paso 4: Submit → loading spinner → pantalla éxito → redirect

#### Dashboard
- [ ] Acceder sin auth → redirect a /auth?returnUrl=/dashboard
- [ ] Role "both" → debe mostrar tabs "Mis espacios", "Mis reservas", "Mensajes"
- [ ] Role "host" → debe mostrar "Mis espacios", "Mensajes" (sin "Mis reservas")
- [ ] Role "renter" → debe mostrar "Mis reservas", "Mensajes" (sin "Mis espacios")
- [ ] Desktop: Tabla responsive con acciones
- [ ] Mobile: Cards apilados con botones
- [ ] Click "Ver" → navega a /espacios/[id]
- [ ] Click "Editar" → abre modal placeholder

---

## Integración Supabase (Próxima Fase)

### Tablas requeridas:

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('renter', 'host', 'both')),
  verified_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `listings` (actualizar)
```sql
ALTER TABLE listings
ADD COLUMN host_id UUID REFERENCES users(id),
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### Row Level Security (RLS):

#### Listings
- SELECT: público puede ver listings activos
- INSERT: usuarios autenticados pueden crear con su propio host_id
- UPDATE/DELETE: solo el owner (host_id = auth.uid())

#### Availability Blocks
- SELECT: público puede ver blocks para calcular disponibilidad
- INSERT/UPDATE/DELETE: solo el owner del listing

### Auth Integration:
- Reemplazar `localStorage` con Supabase Auth session
- Usar `supabase.auth.onAuthStateChange()` en AuthProvider
- Guardar user metadata (fullName, role) en tabla users
- Vincular Google OAuth provider

---

## Rutas NO Implementadas (Fuera de Scope MVP)

- `/checkout` - Flujo de pago con Mercado Pago
- `/reservas` - Vista detallada de reservas individuales
- `/mensajes` - Sistema de mensajería en tiempo real
- `/admin` - Panel de administración para revisar listings

Estas rutas requieren backend funcional y están planificadas para fases posteriores.

---

## Estado del Proyecto

✅ **Completado:**
- Autenticación mock con email y Google OAuth UI
- Wizard de publicación de 4 pasos con validación
- Dashboard role-based con gestión de listings
- AuthContext global con persistencia localStorage
- Navbar actualizado con estado de autenticación
- Tipos y mock data extendidos

🔄 **Pendiente para Producción:**
- Integración real con Supabase Auth
- Subida de fotos a Supabase Storage
- CRUD de listings en base de datos
- Sistema de mensajería
- Flujo de checkout y pagos
- Panel de administración

---

## Comandos de Desarrollo

```bash
# Instalar dependencias (si usas el ZIP descargado)
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

## Variables de Entorno Requeridas (Próxima Fase)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MERCADOPAGO_ACCESS_TOKEN=your_mp_token
```
