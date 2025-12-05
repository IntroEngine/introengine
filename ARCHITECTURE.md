# IntroEngine - Arquitectura del Proyecto

## 📋 Descripción General

**IntroEngine** es un SaaS B2B que actúa como un agente inteligente de prospección y detección de intros. Utiliza IA para enriquecer datos, detectar relaciones (1°, 2° grado e inferencias), generar oportunidades de negocio y sincronizar con HubSpot.

---

## 🌳 Estructura Completa de Carpetas y Archivos

```
IntroEngine/
├── README.md                          # Documentación principal del proyecto
├── package.json                       # Dependencias y scripts del proyecto
├── tsconfig.json                      # Configuración TypeScript
├── next.config.js                     # Configuración Next.js
├── .env.local                         # Variables de entorno (local, no commitear)
├── .env.example                       # Plantilla de variables de entorno
├── .gitignore                         # Archivos a ignorar en Git
│
├── /db                                # Capa de base de datos
│   ├── index.ts                       # Cliente Supabase y conexión principal
│   ├── types.ts                       # TypeScript types/interfaces para todas las tablas
│   ├── queries/
│   │   ├── companies.ts               # Queries CRUD para companies
│   │   ├── contacts.ts                # Queries CRUD para contacts
│   │   ├── opportunities.ts           # Queries CRUD para opportunities
│   │   ├── scores.ts                  # Queries CRUD para scores
│   │   └── users.ts                   # Queries CRUD para users
│   └── helpers/
│       ├── validators.ts              # Validaciones de datos antes de insertar
│       └── transformers.ts            # Transformadores de datos (DB ↔ API)
│
├── /api                               # API Routes (Next.js)
│   ├── /companies
│   │   ├── route.ts                   # POST /api/companies → cargar empresas
│   │   └── [id]/
│   │       └── route.ts               # GET/PUT/DELETE /api/companies/[id]
│   ├── /contacts
│   │   ├── route.ts                   # POST /api/contacts → cargar contactos
│   │   └── [id]/
│   │       └── route.ts               # GET/PUT/DELETE /api/contacts/[id]
│   ├── /opportunities
│   │   ├── route.ts                   # GET /api/opportunities → listar oportunidades
│   │   └── [id]/
│   │       ├── route.ts               # GET /api/opportunities/[id]
│   │       └── /accept/
│   │           └── route.ts           # POST /api/opportunities/[id]/accept
│   ├── /scores
│   │   └── route.ts                   # GET /api/scores → obtener scores de oportunidades
│   ├── /enrich
│   │   ├── /companies
│   │   │   └── route.ts               # POST /api/enrich/companies → enriquecer empresa
│   │   └── /contacts
│   │       └── route.ts               # POST /api/enrich/contacts → enriquecer contacto
│   └── /health
│       └── route.ts                   # GET /api/health → health check
│
├── /cron                              # Cronjobs (Vercel Serverless)
│   ├── /enrich-companies
│   │   └── route.ts                   # Enriquecer empresas pendientes (diario 2am)
│   ├── /generate-opportunities
│   │   └── route.ts                   # Generar nuevas oportunidades (diario 6am)
│   ├── /sync-hubspot
│   │   └── route.ts                   # Sincronizar con HubSpot (cada 4 horas)
│   └── /weekly-advisor
│       └── route.ts                   # Análisis semanal y reporte (lunes 9am)
│
├── /services                          # Lógica de negocio
│   ├── enrichmentService.ts           # Enriquecer empresas/contactos con datos externos
│   ├── relationshipEngine.ts          # Detectar intros (1°, 2° e inferencias)
│   ├── outboundEngine.ts              # Generar outbound inteligente personalizado
│   ├── scoringService.ts              # Calcular scores (industry fit + buying signals + intro strength)
│   ├── hubspotService.ts              # Crear/actualizar leads y deals en HubSpot
│   ├── followupService.ts            # Generar mensajes de seguimiento contextuales
│   ├── weeklyAdvisorService.ts        # Análisis semanal y sugerencias estratégicas
│   └── /ai
│       ├── prompts.ts                 # Todos los prompts centralizados
│       ├── openaiClient.ts            # Cliente OpenAI configurado
│       └── embeddings.ts              # Generar embeddings para búsqueda semántica
│
├── /config                            # Configuraciones centralizadas
│   ├── supabase.ts                    # Configuración cliente Supabase
│   ├── hubspot.ts                     # Configuración cliente HubSpot
│   ├── openai.ts                      # Configuración cliente OpenAI
│   └── env.ts                         # Validación y lectura de variables ENV
│
├── /lib                               # Utilidades compartidas
│   ├── utils.ts                       # Funciones helper genéricas
│   ├── constants.ts                   # Constantes del proyecto
│   └── errors.ts                      # Clases de error personalizadas
│
├── /app                               # Next.js App Router (Frontend)
│   ├── layout.tsx                     # Layout principal
│   ├── page.tsx                       # Página home/landing
│   ├── /dashboard
│   │   ├── layout.tsx                 # Layout del dashboard
│   │   ├── page.tsx                   # Dashboard principal
│   │   ├── /radar
│   │   │   └── page.tsx               # Radar de oportunidades (vista mapa)
│   │   ├── /pipeline
│   │   │   └── page.tsx               # Pipeline de intros (vista kanban)
│   │   ├── /actions
│   │   │   └── page.tsx               # Acciones sugeridas (follow-ups + outbound)
│   │   └── /weekly
│   │       └── page.tsx               # Resumen semanal
│   ├── /upload
│   │   ├── /companies
│   │   │   └── page.tsx               # Formulario para cargar empresas (CSV/JSON)
│   │   └── /contacts
│   │       └── page.tsx               # Formulario para cargar contactos (CSV/JSON)
│   └── /api                           # API Routes (Next.js las mueve aquí automáticamente)
│
├── /components                        # Componentes React reutilizables
│   ├── /ui                            # Componentes base (shadcn/ui o similar)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── /dashboard
│   │   ├── OpportunityRadar.tsx       # Componente del radar de oportunidades
│   │   ├── IntroPipeline.tsx          # Componente del pipeline kanban
│   │   ├── ActionSuggestions.tsx      # Lista de acciones sugeridas
│   │   ├── WeeklySummary.tsx          # Resumen semanal con gráficos
│   │   └── ScoreBadge.tsx             # Badge para mostrar scores
│   ├── /upload
│   │   ├── CompanyUploadForm.tsx      # Formulario de carga de empresas
│   │   ├── ContactUploadForm.tsx      # Formulario de carga de contactos
│   │   └── FileUploader.tsx           # Componente genérico de upload
│   ├── /opportunities
│   │   ├── OpportunityCard.tsx        # Tarjeta de oportunidad
│   │   ├── OpportunityTable.tsx        # Tabla de oportunidades
│   │   └── OpportunityDetail.tsx      # Vista detalle de oportunidad
│   └── /charts
│       ├── ScoreDistribution.tsx      # Gráfico de distribución de scores
│       └── IntroTimeline.tsx          # Timeline de intros detectadas
│
├── /hooks                             # Custom React Hooks
│   ├── useOpportunities.ts            # Hook para fetch/listar oportunidades
│   ├── useCompanies.ts                # Hook para fetch/listar empresas
│   ├── useContacts.ts                 # Hook para fetch/listar contactos
│   ├── useScores.ts                   # Hook para calcular/obtener scores
│   └── useHubspotSync.ts              # Hook para sincronizar con HubSpot
│
├── /context                           # React Context Providers
│   ├── AuthContext.tsx                # Contexto de autenticación (futuro)
│   ├── OpportunitiesContext.tsx       # Contexto global de oportunidades
│   └── UserContext.tsx                # Contexto de usuario (futuro multicliente)
│
├── /types                             # TypeScript types compartidos (Frontend)
│   ├── api.ts                         # Types para respuestas de API
│   ├── opportunities.ts               # Types de oportunidades
│   └── common.ts                      # Types comunes
│
└── /public                            # Archivos estáticos
    ├── /images
    └── /icons
```

---

## 📝 Descripción de Archivos y Carpetas

### **Root Files**

- **README.md**: Documentación principal con descripción del proyecto, stack tecnológico, instrucciones de instalación, configuración de variables de entorno, y guía de desarrollo.
- **package.json**: Dependencias del proyecto (Next.js, TypeScript, Supabase, OpenAI, HubSpot SDK, etc.) y scripts (dev, build, start, lint).
- **tsconfig.json**: Configuración TypeScript con paths aliases y strict mode.
- **next.config.js**: Configuración Next.js (rewrites, headers, env vars públicas).
- **.env.local**: Variables de entorno locales (no se commitea).
- **.env.example**: Plantilla con todas las variables necesarias documentadas.

---

### **/db - Capa de Base de Datos**

#### **index.ts**
- Cliente Supabase inicializado y exportado.
- Funciones helper para transacciones y manejo de errores.

#### **types.ts**
- Interfaces TypeScript para todas las tablas:
  - `Company`, `Contact`, `Opportunity`, `Score`, `User`
- Types para relaciones y joins.

#### **/queries/**
- **companies.ts**: Funciones para CRUD de empresas (create, getById, getAll, update, delete, search).
- **contacts.ts**: Funciones para CRUD de contactos (create, getById, getAll, update, delete, searchByCompany).
- **opportunities.ts**: Funciones para CRUD de oportunidades (create, getAll, getById, updateStatus, getByScore).
- **scores.ts**: Funciones para CRUD de scores (create, getByOpportunity, update, calculateAverage).
- **users.ts**: Funciones para CRUD de usuarios (futuro multicliente).

#### **/helpers/**
- **validators.ts**: Validaciones de datos antes de insertar en DB (email, URL, phone, etc.).
- **transformers.ts**: Transformadores de datos entre formato DB y formato API.

---

### **/api - API Routes**

#### **/companies**
- **route.ts**: 
  - `POST`: Validar y crear empresa en DB.
  - `GET`: Listar empresas con filtros (paginación, búsqueda).

#### **/companies/[id]**
- **route.ts**: 
  - `GET`: Obtener empresa por ID.
  - `PUT`: Actualizar empresa.
  - `DELETE`: Eliminar empresa.

#### **/contacts**
- **route.ts**: 
  - `POST`: Validar y crear contacto en DB.
  - `GET`: Listar contactos con filtros.

#### **/contacts/[id]**
- **route.ts**: 
  - `GET`: Obtener contacto por ID.
  - `PUT`: Actualizar contacto.
  - `DELETE`: Eliminar contacto.

#### **/opportunities**
- **route.ts**: 
  - `GET`: Listar oportunidades con filtros (score, status, fecha).
  - `POST`: Crear oportunidad manualmente (opcional).

#### **/opportunities/[id]**
- **route.ts**: 
  - `GET`: Obtener oportunidad por ID con detalles completos.
  - `PUT`: Actualizar oportunidad.

#### **/opportunities/[id]/accept**
- **route.ts**: 
  - `POST`: Aceptar oportunidad y crear deal en HubSpot.

#### **/scores**
- **route.ts**: 
  - `GET`: Obtener scores de oportunidades con filtros.

#### **/enrich/companies**
- **route.ts**: 
  - `POST`: Endpoint para enriquecer empresa manualmente (trigger desde UI).

#### **/enrich/contacts**
- **route.ts**: 
  - `POST`: Endpoint para enriquecer contacto manualmente.

#### **/health**
- **route.ts**: 
  - `GET`: Health check de la API y conexiones (Supabase, OpenAI, HubSpot).

---

### **/cron - Cronjobs Serverless**

#### **/enrich-companies/route.ts**
- **Cuándo corre**: Diario a las 2:00 AM (UTC).
- **Qué hace**: 
  - Busca empresas con `enrichment_status = 'pending'`.
  - Llama a `enrichmentService.enrichCompany()`.
  - Actualiza `enrichment_status = 'completed'` o `'failed'`.

#### **/generate-opportunities/route.ts**
- **Cuándo corre**: Diario a las 6:00 AM (UTC).
- **Qué hace**: 
  - Ejecuta `relationshipEngine.detectIntros()`.
  - Genera oportunidades nuevas.
  - Calcula scores con `scoringService.calculateScore()`.
  - Guarda en DB.

#### **/sync-hubspot/route.ts**
- **Cuándo corre**: Cada 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC).
- **Qué hace**: 
  - Busca oportunidades con `hubspot_synced = false`.
  - Crea/actualiza leads y deals en HubSpot.
  - Actualiza `hubspot_synced = true` y guarda `hubspot_id`.

#### **/weekly-advisor/route.ts**
- **Cuándo corre**: Lunes a las 9:00 AM (UTC).
- **Qué hace**: 
  - Ejecuta `weeklyAdvisorService.generateReport()`.
  - Genera análisis semanal con sugerencias.
  - Guarda reporte en DB o envía email (futuro).

---

### **/services - Lógica de Negocio**

#### **enrichmentService.ts**
- **Función**: Enriquecer empresas/contactos con datos externos.
- **Métodos**:
  - `enrichCompany(companyId)`: Obtiene datos de empresa (industria, tamaño, funding, etc.) usando APIs externas o scraping.
  - `enrichContact(contactId)`: Obtiene datos de contacto (LinkedIn, email, rol, etc.).
- **Integraciones**: APIs externas (Clearbit, Apollo, LinkedIn, etc.) o scraping.

#### **relationshipEngine.ts**
- **Función**: Detectar intros (1°, 2° e inferencias).
- **Métodos**:
  - `detectIntros()`: Analiza relaciones entre contactos y empresas.
  - `findFirstDegreeIntros()`: Detecta conexiones directas.
  - `findSecondDegreeIntros()`: Detecta conexiones de segundo grado.
  - `inferIntros()`: Usa IA para inferir intros basadas en contexto.
- **Integraciones**: OpenAI para inferencias, análisis de redes.

#### **outboundEngine.ts**
- **Función**: Generar outbound inteligente personalizado.
- **Métodos**:
  - `generateOutboundMessage(opportunityId)`: Genera mensaje personalizado usando IA.
  - `generateEmailSequence(opportunityId)`: Genera secuencia de emails.
- **Integraciones**: OpenAI para generación de contenido.

#### **scoringService.ts**
- **Función**: Calcular scores (industry fit + buying signals + intro strength).
- **Métodos**:
  - `calculateScore(opportunityId)`: Calcula score total.
  - `calculateIndustryFit(company, targetIndustry)`: Score de fit de industria.
  - `calculateBuyingSignals(company)`: Score de señales de compra.
  - `calculateIntroStrength(intro)`: Score de fuerza de la intro.
- **Integraciones**: Lógica propia + IA para análisis.

#### **hubspotService.ts**
- **Función**: Crear/actualizar leads y deals en HubSpot.
- **Métodos**:
  - `createLead(contact)`: Crea lead en HubSpot.
  - `createDeal(opportunity)`: Crea deal en HubSpot.
  - `updateDeal(dealId, data)`: Actualiza deal.
  - `syncOpportunity(opportunityId)`: Sincroniza oportunidad completa.
- **Integraciones**: HubSpot API (REST o SDK).

#### **followupService.ts**
- **Función**: Generar mensajes de seguimiento contextuales.
- **Métodos**:
  - `generateFollowup(opportunityId, context)`: Genera mensaje de seguimiento.
  - `scheduleFollowup(opportunityId, date)`: Agenda seguimiento.
- **Integraciones**: OpenAI para generación de contenido.

#### **weeklyAdvisorService.ts**
- **Función**: Análisis semanal y sugerencias estratégicas.
- **Métodos**:
  - `generateReport()`: Genera reporte semanal con análisis.
  - `getSuggestions()`: Obtiene sugerencias estratégicas.
- **Integraciones**: OpenAI para análisis y generación de insights.

#### **/ai/**
- **prompts.ts**: Todos los prompts centralizados (enriquecimiento, detección de intros, outbound, scoring, etc.).
- **openaiClient.ts**: Cliente OpenAI configurado con retry logic y rate limiting.
- **embeddings.ts**: Generar embeddings para búsqueda semántica (opcional).

---

### **/config - Configuraciones**

#### **supabase.ts**
- Cliente Supabase inicializado con variables de entorno.
- Funciones helper para conexión.

#### **hubspot.ts**
- Cliente HubSpot inicializado con API key/token.
- Configuración de propiedades personalizadas.

#### **openai.ts**
- Cliente OpenAI inicializado con API key.
- Configuración de modelos (GPT-4.1 o GPT-5).

#### **env.ts**
- Validación de variables de entorno requeridas.
- Lectura centralizada de ENV con tipos TypeScript.

---

### **/lib - Utilidades**

#### **utils.ts**
- Funciones helper genéricas (formateo de fechas, validaciones, etc.).

#### **constants.ts**
- Constantes del proyecto (status de oportunidades, tipos de intro, etc.).

#### **errors.ts**
- Clases de error personalizadas (ApiError, ValidationError, etc.).

---

### **/app - Frontend Next.js**

#### **layout.tsx**
- Layout principal con providers y navegación.

#### **page.tsx**
- Página home/landing del proyecto.

#### **/dashboard**
- **layout.tsx**: Layout del dashboard con sidebar y navegación.
- **page.tsx**: Dashboard principal con resumen y métricas.
- **/radar/page.tsx**: Vista de radar de oportunidades (mapa visual).
- **/pipeline/page.tsx**: Vista de pipeline kanban de intros.
- **/actions/page.tsx**: Lista de acciones sugeridas (follow-ups + outbound).
- **/weekly/page.tsx**: Resumen semanal con gráficos y análisis.

#### **/upload**
- **/companies/page.tsx**: Formulario para cargar empresas (CSV/JSON upload).
- **/contacts/page.tsx**: Formulario para cargar contactos (CSV/JSON upload).

---

### **/components - Componentes React**

#### **/ui**
- Componentes base reutilizables (Button, Card, Table, Input, Select, etc.).
- Puede usar shadcn/ui o crear componentes propios.

#### **/dashboard**
- **OpportunityRadar.tsx**: Componente del radar de oportunidades (mapa visual interactivo).
- **IntroPipeline.tsx**: Componente del pipeline kanban (drag & drop).
- **ActionSuggestions.tsx**: Lista de acciones sugeridas con botones de acción.
- **WeeklySummary.tsx**: Resumen semanal con gráficos (Chart.js o Recharts).
- **ScoreBadge.tsx**: Badge para mostrar scores con colores.

#### **/upload**
- **CompanyUploadForm.tsx**: Formulario de carga de empresas con validación.
- **ContactUploadForm.tsx**: Formulario de carga de contactos con validación.
- **FileUploader.tsx**: Componente genérico de upload con drag & drop.

#### **/opportunities**
- **OpportunityCard.tsx**: Tarjeta de oportunidad con información resumida.
- **OpportunityTable.tsx**: Tabla de oportunidades con filtros y ordenamiento.
- **OpportunityDetail.tsx**: Vista detalle de oportunidad con toda la información.

#### **/charts**
- **ScoreDistribution.tsx**: Gráfico de distribución de scores.
- **IntroTimeline.tsx**: Timeline de intros detectadas.

---

### **/hooks - Custom Hooks**

#### **useOpportunities.ts**
- Hook para fetch/listar oportunidades con filtros y paginación.

#### **useCompanies.ts**
- Hook para fetch/listar empresas.

#### **useContacts.ts**
- Hook para fetch/listar contactos.

#### **useScores.ts**
- Hook para calcular/obtener scores.

#### **useHubspotSync.ts**
- Hook para sincronizar con HubSpot desde el frontend.

---

### **/context - React Context**

#### **AuthContext.tsx**
- Contexto de autenticación (futuro, para multicliente).

#### **OpportunitiesContext.tsx**
- Contexto global de oportunidades para compartir estado.

#### **UserContext.tsx**
- Contexto de usuario (futuro multicliente).

---

### **/types - Types Frontend**

#### **api.ts**
- Types para respuestas de API.

#### **opportunities.ts**
- Types de oportunidades para el frontend.

#### **common.ts**
- Types comunes compartidos.

---

## 🔌 Puntos de Integración

### **1. Supabase (Base de Datos)**
- **Archivo**: `/config/supabase.ts`
- **Uso**: Todas las queries en `/db/queries/*`
- **Variables ENV**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### **2. OpenAI (IA)**
- **Archivo**: `/config/openai.ts`, `/services/ai/openaiClient.ts`
- **Uso**: Todos los servicios que usan IA (`relationshipEngine`, `outboundEngine`, `scoringService`, etc.)
- **Variables ENV**: `OPENAI_API_KEY`, `OPENAI_MODEL` (opcional, default GPT-4.1)

### **3. HubSpot (CRM)**
- **Archivo**: `/config/hubspot.ts`
- **Uso**: `hubspotService.ts` y cronjob `/cron/sync-hubspot`
- **Variables ENV**: `HUBSPOT_API_KEY` o `HUBSPOT_ACCESS_TOKEN`

### **4. APIs de Enriquecimiento (Opcional)**
- **Archivo**: `/services/enrichmentService.ts`
- **Opciones**: Clearbit, Apollo, LinkedIn API, etc.
- **Variables ENV**: `CLEARBIT_API_KEY`, `APOLLO_API_KEY`, etc.

### **5. Vercel Cron (Cronjobs)**
- **Archivo**: `vercel.json` (en root)
- **Configuración**: Define los schedules de cada cronjob
- **Ejemplo**:
```json
{
  "crons": [
    {
      "path": "/cron/enrich-companies",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/cron/generate-opportunities",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 🎯 Módulos Core (Prioridad Alta)

### **Fase 1: Fundación**
1. **Configuración Base**
   - `/config/env.ts` - Validación de ENV
   - `/config/supabase.ts` - Conexión a DB
   - `/db/types.ts` - Types de tablas
   - `/db/index.ts` - Cliente Supabase

2. **Base de Datos**
   - Crear tablas en Supabase (SQL migrations)
   - `/db/queries/companies.ts` - CRUD básico
   - `/db/queries/contacts.ts` - CRUD básico
   - `/db/queries/opportunities.ts` - CRUD básico

3. **API Básica**
   - `/api/companies/route.ts` - POST y GET
   - `/api/contacts/route.ts` - POST y GET
   - `/api/opportunities/route.ts` - GET
   - `/api/health/route.ts` - Health check

### **Fase 2: IA y Lógica de Negocio**
4. **IA Core**
   - `/config/openai.ts` - Cliente OpenAI
   - `/services/ai/prompts.ts` - Prompts centralizados
   - `/services/ai/openaiClient.ts` - Wrapper con retry

5. **Servicios Core**
   - `/services/relationshipEngine.ts` - Detección de intros
   - `/services/scoringService.ts` - Cálculo de scores
   - `/services/enrichmentService.ts` - Enriquecimiento (con mocks)

### **Fase 3: Integraciones**
6. **HubSpot**
   - `/config/hubspot.ts` - Cliente HubSpot
   - `/services/hubspotService.ts` - Sincronización

7. **Cronjobs**
   - `/cron/generate-opportunities/route.ts` - Generar oportunidades
   - `/cron/sync-hubspot/route.ts` - Sincronizar HubSpot

### **Fase 4: Frontend**
8. **UI Base**
   - `/components/ui/*` - Componentes base
   - `/app/dashboard/page.tsx` - Dashboard principal
   - `/app/upload/*` - Formularios de carga

9. **Visualización**
   - `/components/dashboard/OpportunityTable.tsx` - Tabla de oportunidades
   - `/components/dashboard/IntroPipeline.tsx` - Pipeline kanban
   - `/app/dashboard/radar/page.tsx` - Radar visual

---

## 🎭 Archivos con Mocks (Para Empezar Rápido)

### **1. `/services/enrichmentService.ts`**
- Mock de datos de enriquecimiento (industria, tamaño, funding, etc.)
- Retornar datos hardcodeados hasta integrar APIs reales

### **2. `/services/hubspotService.ts`**
- Mock de creación de leads/deals
- Log en consola en lugar de llamar a HubSpot API
- Retornar IDs mock

### **3. `/services/relationshipEngine.ts`**
- Mock de detección de intros (retornar intros hardcodeadas)
- Simular lógica de 1° y 2° grado con datos de prueba

### **4. `/services/scoringService.ts`**
- Mock de cálculo de scores (retornar scores aleatorios o fijos)
- Simular lógica de industry fit, buying signals, etc.

### **5. `/services/outboundEngine.ts`**
- Mock de generación de outbound (retornar mensajes template)
- Simular generación con IA

### **6. `/services/followupService.ts`**
- Mock de generación de follow-ups (retornar mensajes template)

### **7. `/services/weeklyAdvisorService.ts`**
- Mock de reporte semanal (retornar datos hardcodeados)

### **8. `/api/enrich/*`**
- Endpoints que llaman a servicios mock

### **9. `/cron/*`**
- Cronjobs que ejecutan servicios mock (con logs)

---

## 📅 Orden de Implementación Recomendado

### **Sprint 1: Setup y Base de Datos (Semana 1)**
1. ✅ Crear proyecto Next.js con TypeScript
2. ✅ Configurar Supabase (crear proyecto, obtener credenciales)
3. ✅ Crear tablas en Supabase (SQL migrations)
4. ✅ Configurar `/config/env.ts` y `/config/supabase.ts`
5. ✅ Crear `/db/types.ts` con interfaces
6. ✅ Crear `/db/index.ts` con cliente Supabase
7. ✅ Implementar `/db/queries/companies.ts` (CRUD básico)
8. ✅ Implementar `/db/queries/contacts.ts` (CRUD básico)
9. ✅ Implementar `/db/queries/opportunities.ts` (CRUD básico)
10. ✅ Crear `/api/health/route.ts` para probar conexión

### **Sprint 2: API Básica (Semana 1-2)**
11. ✅ Implementar `/api/companies/route.ts` (POST, GET)
12. ✅ Implementar `/api/contacts/route.ts` (POST, GET)
13. ✅ Implementar `/api/opportunities/route.ts` (GET)
14. ✅ Agregar validación de inputs en APIs
15. ✅ Probar endpoints con Postman/Thunder Client

### **Sprint 3: IA Core (Semana 2)**
16. ✅ Configurar `/config/openai.ts`
17. ✅ Crear `/services/ai/prompts.ts` con prompts base
18. ✅ Crear `/services/ai/openaiClient.ts` con retry logic
19. ✅ Implementar `/services/relationshipEngine.ts` (con mocks primero)
20. ✅ Implementar `/services/scoringService.ts` (con mocks primero)
21. ✅ Probar detección de intros con datos de prueba

### **Sprint 4: Enriquecimiento y Servicios (Semana 3)**
22. ✅ Implementar `/services/enrichmentService.ts` (con mocks)
23. ✅ Implementar `/services/outboundEngine.ts` (con mocks)
24. ✅ Implementar `/services/followupService.ts` (con mocks)
25. ✅ Crear `/api/enrich/companies/route.ts`
26. ✅ Crear `/api/enrich/contacts/route.ts`
27. ✅ Probar enriquecimiento manual desde API

### **Sprint 5: Cronjobs (Semana 3-4)**
28. ✅ Configurar `vercel.json` con cronjobs
29. ✅ Implementar `/cron/enrich-companies/route.ts` (con mocks)
30. ✅ Implementar `/cron/generate-opportunities/route.ts` (con mocks)
31. ✅ Implementar `/cron/sync-hubspot/route.ts` (con mocks)
32. ✅ Implementar `/cron/weekly-advisor/route.ts` (con mocks)
33. ✅ Probar cronjobs localmente (usar Vercel CLI)

### **Sprint 6: HubSpot Integration (Semana 4)**
34. ✅ Configurar `/config/hubspot.ts`
35. ✅ Implementar `/services/hubspotService.ts` (reemplazar mocks)
36. ✅ Actualizar `/cron/sync-hubspot/route.ts` con integración real
37. ✅ Crear `/api/opportunities/[id]/accept/route.ts`
38. ✅ Probar sincronización con HubSpot

### **Sprint 7: Frontend Base (Semana 5)**
39. ✅ Instalar y configurar componentes UI (shadcn/ui o similar)
40. ✅ Crear `/app/layout.tsx` y `/app/page.tsx`
41. ✅ Crear `/app/dashboard/layout.tsx` y `/app/dashboard/page.tsx`
42. ✅ Crear `/components/ui/*` (Button, Card, Table, Input)
43. ✅ Crear hooks `/hooks/useOpportunities.ts`, `/hooks/useCompanies.ts`
44. ✅ Crear `/context/OpportunitiesContext.tsx`

### **Sprint 8: Upload y Dashboard (Semana 5-6)**
45. ✅ Crear `/app/upload/companies/page.tsx` con formulario
46. ✅ Crear `/app/upload/contacts/page.tsx` con formulario
47. ✅ Crear `/components/upload/FileUploader.tsx`
48. ✅ Crear `/components/dashboard/OpportunityTable.tsx`
49. ✅ Crear `/components/dashboard/OpportunityCard.tsx`
50. ✅ Integrar upload con API

### **Sprint 9: Visualización Avanzada (Semana 6-7)**
51. ✅ Crear `/app/dashboard/pipeline/page.tsx` (kanban)
52. ✅ Crear `/components/dashboard/IntroPipeline.tsx`
53. ✅ Crear `/app/dashboard/radar/page.tsx` (mapa visual)
54. ✅ Crear `/components/dashboard/OpportunityRadar.tsx`
55. ✅ Crear `/app/dashboard/actions/page.tsx`
56. ✅ Crear `/components/dashboard/ActionSuggestions.tsx`

### **Sprint 10: Refinamiento y Producción (Semana 7-8)**
57. ✅ Reemplazar mocks con integraciones reales
58. ✅ Implementar `/services/weeklyAdvisorService.ts` completo
59. ✅ Crear `/app/dashboard/weekly/page.tsx`
60. ✅ Crear `/components/dashboard/WeeklySummary.tsx`
61. ✅ Agregar manejo de errores y logging
62. ✅ Optimizar queries y performance
63. ✅ Testing básico (opcional)
64. ✅ Deploy a Vercel y configurar variables de entorno
65. ✅ Configurar cronjobs en Vercel
66. ✅ Documentación final

---

## 🚀 Scripts Sugeridos en package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > db/types.ts",
    "db:migrate": "supabase migration up",
    "test:api": "node scripts/test-api.js"
  }
}
```

---

## 📊 Tablas de Base de Datos (Supabase)

### **companies**
- `id` (uuid, PK)
- `name` (text)
- `domain` (text, unique)
- `industry` (text)
- `size` (text) - 'startup', 'small', 'medium', 'large'
- `funding_stage` (text) - 'seed', 'series-a', 'series-b', etc.
- `location` (text)
- `website` (text)
- `enrichment_status` (text) - 'pending', 'completed', 'failed'
- `enrichment_data` (jsonb) - datos enriquecidos
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **contacts**
- `id` (uuid, PK)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `phone` (text)
- `title` (text)
- `company_id` (uuid, FK → companies.id)
- `linkedin_url` (text)
- `enrichment_status` (text)
- `enrichment_data` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **opportunities**
- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id)
- `contact_id` (uuid, FK → contacts.id)
- `intro_type` (text) - 'first_degree', 'second_degree', 'inferred'
- `intro_strength` (numeric) - 0-100
- `intro_path` (jsonb) - ruta de la intro (array de contactos)
- `status` (text) - 'new', 'contacted', 'qualified', 'closed', 'lost'
- `hubspot_synced` (boolean)
- `hubspot_deal_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **scores**
- `id` (uuid, PK)
- `opportunity_id` (uuid, FK → opportunities.id)
- `industry_fit` (numeric) - 0-100
- `buying_signals` (numeric) - 0-100
- `intro_strength` (numeric) - 0-100
- `total_score` (numeric) - 0-100
- `calculated_at` (timestamp)

### **users** (futuro multicliente)
- `id` (uuid, PK)
- `email` (text, unique)
- `name` (text)
- `hubspot_api_key` (text, encrypted)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## ✅ Checklist de Configuración Inicial

- [ ] Crear proyecto en Supabase
- [ ] Crear tablas con SQL migrations
- [ ] Obtener credenciales de Supabase
- [ ] Crear cuenta en OpenAI y obtener API key
- [ ] Crear cuenta en HubSpot y obtener API key
- [ ] Configurar proyecto en Vercel
- [ ] Configurar variables de entorno en Vercel
- [ ] Configurar cronjobs en `vercel.json`
- [ ] Instalar dependencias del proyecto
- [ ] Probar conexión a Supabase
- [ ] Probar conexión a OpenAI
- [ ] Probar conexión a HubSpot

---

## 📚 Recursos Adicionales

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **HubSpot API Docs**: https://developers.hubspot.com/docs/api/overview
- **Vercel Cron Docs**: https://vercel.com/docs/cron-jobs

---

**¡Listo para empezar a construir IntroEngine! 🚀**
