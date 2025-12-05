# Relationship Engine - IntroEngine

Motor principal para detectar oportunidades de intro (referidos) entre contactos del usuario y contactos objetivo.

## Descripción

El Relationship Engine analiza las relaciones entre:
- **Bridge Contacts**: Contactos que conoce el usuario y pueden servir como puente
- **Target Contacts**: Contactos objetivo dentro de empresas target
- **Companies**: Empresas objetivo donde queremos generar oportunidades

## Tipos de Rutas Soportadas

1. **DIRECT**: El usuario conoce directamente al contacto objetivo o a alguien que puede presentar directamente
2. **SECOND_LEVEL**: El usuario conoce a alguien que conoce al objetivo
3. **INFERRED**: La IA infiere relación probable basada en:
   - Historial laboral compartido
   - Empresas en común
   - Puestos anteriores similares
   - Interacciones públicas
   - Conexiones compartidas

## Funciones Públicas

### `findIntroOpportunitiesForCompany(accountId: string, companyId: string): Promise<void>`

Encuentra oportunidades de intro para una empresa específica.

```typescript
import { findIntroOpportunitiesForCompany } from '@/services/relationshipEngine'

await findIntroOpportunitiesForCompany(accountId, companyId)
```

### `findIntroOpportunitiesForCompanies(accountId: string, companyIds: string[]): Promise<{ processed: number; errors: number }>`

Procesa múltiples empresas en batch.

```typescript
import { findIntroOpportunitiesForCompanies } from '@/services/relationshipEngine'

const result = await findIntroOpportunitiesForCompanies(accountId, [
  'company-1',
  'company-2',
  'company-3'
])
```

### `recalculateIntroOpportunitiesForAccount(accountId: string): Promise<{ processed: number; errors: number }>`

Recalcula oportunidades para todas las empresas activas de una cuenta.

```typescript
import { recalculateIntroOpportunitiesForAccount } from '@/services/relationshipEngine'

const result = await recalculateIntroOpportunitiesForAccount(accountId)
```

## Flujo Interno

1. **Lectura de datos**: Carga company, contacts, relationships y existing opportunities desde Supabase
2. **Separación de contactos**: Identifica bridge contacts y target candidates
3. **Construcción de contexto**: Crea un JSON compacto con toda la información relevante
4. **Análisis con IA**: Llama a OpenAI para detectar relaciones y generar oportunidades
5. **Validación**: Parsea y valida la respuesta de OpenAI
6. **Persistencia**: Crea o actualiza oportunidades y scores en Supabase

## Estructura de Datos

### Oportunidad Generada

```typescript
{
  company_id: string
  target: {
    id: string
    full_name: string
    role_title: string
    seniority: string
  }
  best_route: {
    type: 'direct' | 'second_level' | 'inferred'
    bridge_contact: { id: string; full_name: string } | null
    confidence: number // 0-100
    why: string
  }
  suggested_intro_message: string
  score: {
    intro_strength_score: number // 0-100
  }
}
```

## Configuración Requerida

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview # o gpt-5 cuando esté disponible
```

### Dependencias

```bash
npm install @supabase/supabase-js openai
```

## TODOs Pendientes

1. **OpenAI Integration**: Implementar llamada real a OpenAI en `services/ai/openai-helper.ts`
2. **Logging**: Reemplazar `console.log/error` con sistema de logging centralizado
3. **Error Handling**: Mejorar manejo de errores y retry logic
4. **Caching**: Implementar caché para evitar llamadas redundantes a OpenAI
5. **Rate Limiting**: Agregar rate limiting para OpenAI API
6. **Target Identification**: Implementar lógica para identificar targets potenciales cuando no hay target candidates

## Estructura de Archivos

```
services/
├── relationshipEngine.ts          # Motor principal
├── relationshipEngine.example.ts  # Ejemplos de uso
├── ai/
│   ├── prompts.ts                 # Prompts para OpenAI
│   └── openai-helper.ts           # Helper de integración con OpenAI
└── README.md                       # Esta documentación
```

## Notas de Implementación

- El engine evita duplicados comparando `company_id + target_contact_id + bridge_contact_id`
- Solo persiste oportunidades con `confidence >= 30` y `intro_strength_score >= 30`
- Los errores en una empresa no rompen el procesamiento batch
- Las oportunidades se crean con `status = 'suggested'` y `type = 'intro'`
