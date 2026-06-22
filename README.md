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

## Configuración

### 1. Variables de Entorno

Copia `.env.local.example` a `.env.local` y configura tus credenciales de Supabase:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-de-supabase
```

### 2. Instalación

```bash
npm install
```

### 3. Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Build de Producción

```bash
npm run build
npm start
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

## Próximos Pasos

1. Configurar tu proyecto de Supabase
2. Crear las tablas necesarias en la base de datos
3. Implementar funcionalidades específicas de cada rol
4. Agregar componentes UI según necesidades
