# Plataforma de Bienestar Estudiantil

Plataforma web para promover el bienestar psicológico, académico y estudiantil en instituciones de educación superior.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (autenticación + base de datos)
- **@supabase/ssr** (autenticación basada en cookies)

## Estructura del Proyecto

```
app/
  (auth)/
    login/          # Página de inicio de sesión
    register/       # Página de registro
  (dashboard)/
    estudiante/     # Dashboard para estudiantes
    consejero/      # Dashboard para consejeros
  layout.tsx
  page.tsx
components/
  ui/               # Componentes de UI reutilizables
lib/
  supabase/
    client.ts       # Cliente de Supabase (lado del cliente)
    server.ts       # Cliente de Supabase (lado del servidor)
middleware.ts       # Protección de rutas y autenticación
```


## Características de Autenticación

- **Registro de usuarios** con selección de rol (estudiante/consejero)
- **Inicio de sesión** con email y contraseña
- **Protección de rutas** mediante middleware
- **Redirección basada en roles**:
  - Estudiantes → `/dashboard/estudiante`
  - Consejeros → `/dashboard/consejero`
- **Autenticación basada en cookies** compatible con Next.js App Router

## Rutas

- `/` - Página de inicio
- `/login` - Inicio de sesión
- `/register` - Registro de usuarios
- `/dashboard/estudiante` - Dashboard de estudiante (protegido)
- `/dashboard/consejero` - Dashboard de consejero (protegido)
