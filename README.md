# IntroEngine

SaaS B2B para detección de intros y oportunidades de outbound usando IA.

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+ y npm
- Cuenta de Supabase
- Cuenta de OpenAI (con API key)
- (Opcional) Cuentas de Clearbit, Apollo, HubSpot

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd intro
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` y completa con tus valores:
- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key de Supabase
- `OPENAI_API_KEY` - Tu API key de OpenAI
- (Opcional) `CLEARBIT_API_KEY`, `APOLLO_API_KEY`, `HUBSPOT_API_KEY`

4. **Configurar base de datos**
- Crea un proyecto en [Supabase](https://supabase.com)
- Ejecuta el SQL desde `schema.sql` en el SQL Editor de Supabase
- Esto creará todas las tablas necesarias

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Deployment en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Push a GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configurar Variables de Entorno**
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables de `.env.example`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`
     - `OPENAI_MODEL` (opcional)
     - `CLEARBIT_API_KEY` (opcional)
     - `APOLLO_API_KEY` (opcional)
     - `HUBSPOT_API_KEY` (opcional)
     - `CRON_SECRET` (opcional, para proteger cronjobs)

4. **Deploy**
   - Click en "Deploy"
   - Vercel construirá y desplegará automáticamente
   - Obtendrás una URL como: `https://introengine.vercel.app`

### Opción 2: Desde CLI de Vercel

1. **Instalar Vercel CLI**
```bash
npm i -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Configurar variables de entorno**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
# ... repite para cada variable
```

5. **Deploy a producción**
```bash
vercel --prod
```

## 🔧 Configuración de Cronjobs

Los cronjobs están configurados en `vercel.json`:

- **Enriquecimiento**: Diario a las 2:00 AM UTC (`/api/cron/enrich`)
- **Oportunidades**: Diario a las 6:00 AM UTC (`/api/cron/opportunities`)
- **Resumen Semanal**: Lunes a las 8:00 AM UTC (`/api/cron/weekly-advisor`)
- **Sincronización HubSpot**: Cada 6 horas (`/api/cron/hubspot-sync`)

Los cronjobs se activan automáticamente en Vercel. Para protegerlos, configura `CRON_SECRET` y descomenta la validación en cada ruta de cronjob.

## 📁 Estructura del Proyecto

```
intro/
├── app/                    # Next.js App Router
│   ├── (app)/             # Rutas protegidas (dashboard)
│   ├── (marketing)/       # Rutas públicas (landing, login)
│   └── api/               # API Routes
├── components/            # Componentes React
├── config/                # Configuraciones (Supabase, etc.)
├── services/              # Lógica de negocio
│   ├── ai/                # Integración con OpenAI
│   ├── enrichmentService.ts
│   ├── buyingSignalsService.ts
│   ├── relationshipEngine.ts
│   └── ...
├── schema.sql             # Schema de base de datos
└── vercel.json            # Configuración de Vercel
```

## 🔑 Variables de Entorno Requeridas

### Requeridas
- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key de Supabase
- `OPENAI_API_KEY` - API key de OpenAI

### Opcionales
- `OPENAI_MODEL` - Modelo de OpenAI (default: gpt-4-turbo-preview)
- `CLEARBIT_API_KEY` - Para enriquecimiento de empresas
- `APOLLO_API_KEY` - Para enriquecimiento de contactos
- `HUBSPOT_API_KEY` - Para sincronización con HubSpot
- `CRON_SECRET` - Token para proteger cronjobs

## 🗄️ Base de Datos

El proyecto usa Supabase (PostgreSQL). Ejecuta `schema.sql` en el SQL Editor de Supabase para crear todas las tablas.

### Tablas principales:
- `accounts` - Cuentas multi-tenant
- `users` - Usuarios
- `companies` - Empresas objetivo
- `contacts` - Contactos
- `opportunities` - Oportunidades detectadas
- `scores` - Scores calculados por IA
- `buying_signals` - Señales de compra detectadas
- `activity_logs` - Log de actividades

## 🧪 Testing Local

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 📚 Documentación Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura detallada del proyecto
- [ANALISIS_ESTADO.md](./ANALISIS_ESTADO.md) - Estado actual del proyecto
- [QUE_FALTA.md](./QUE_FALTA.md) - Lista de tareas pendientes
- [services/README.md](./services/README.md) - Documentación de servicios

## 🐛 Troubleshooting

### Error: "Supabase credentials not configured"
- Verifica que `.env.local` existe y tiene las variables correctas
- En Vercel, verifica que las variables están configuradas en Settings > Environment Variables

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` es válida
- Verifica que tienes créditos en tu cuenta de OpenAI

### Cronjobs no se ejecutan
- Verifica que `vercel.json` está en el root del proyecto
- Los cronjobs solo funcionan en producción (no en preview deployments)
- Verifica los logs en Vercel Dashboard > Functions

## 📝 Licencia

[Tu licencia aquí]

## 👥 Contribuir

[Instrucciones de contribución]
