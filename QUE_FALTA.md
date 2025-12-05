# 📋 Lo que Falta por Implementar - IntroEngine

## 🎯 Resumen Ejecutivo

**Estado Actual**: ~85% completo
- ✅ OpenAI: 100% completo
- ✅ Autenticación: 95% completo (falta RLS)
- ⚠️ Frontend-Backend: 20% completo (falta conectar)
- ⚠️ HubSpot: 50% completo (falta configuración por account)

---

## 🔴 CRÍTICO (Bloquea funcionalidad)

### 1. **Conexión Frontend-Backend** 🟡 ALTA PRIORIDAD
**Estado**: 20% completo - Las páginas tienen UI pero usan datos mock

**Qué falta**:
- ❌ Reemplazar datos mock en todas las páginas con llamadas reales a API
- ❌ Implementar hooks personalizados (`useOpportunities`, `useCompanies`, `useContacts`)
- ❌ Manejo de estados de carga (loading, error, success)
- ❌ Actualización reactiva con React Query o SWR
- ❌ Optimistic updates para mejor UX

**Archivos a modificar**:
- `app/(app)/dashboard/page.tsx` - Conectar KPIs y oportunidades
- `app/(app)/companies/page.tsx` - Conectar lista y creación
- `app/(app)/contacts/page.tsx` - Conectar lista y creación
- `app/(app)/opportunities/page.tsx` - Conectar lista con filtros
- `app/(app)/opportunities/[id]/page.tsx` - Conectar detalle
- `app/(app)/actions/page.tsx` - Conectar acciones
- `app/(app)/weekly-summary/page.tsx` - Conectar resumen

**Tiempo estimado**: 3-4 días

---

### 2. **Configuración de HubSpot por Account** 🔴 CRÍTICA
**Estado**: 50% completo - Lógica implementada, falta configuración

**Qué falta**:
- ❌ Almacenar API keys de HubSpot por account (en tabla `settings`)
- ❌ Encriptación de API keys
- ❌ UI para configurar HubSpot en settings
- ❌ Validación de credenciales de HubSpot
- ❌ Actualizar `services/hubspotService.ts` para usar API keys por account

**Archivos a crear/modificar**:
- `app/(app)/settings/page.tsx` - Crear página de configuración
- `services/hubspotService.ts` - Función `getHubSpotApiKeyForAccount`
- Tabla `settings` en Supabase (ya existe, solo usar)

**Tiempo estimado**: 1-2 días

---

## 🟡 ALTA PRIORIDAD (Funcionalidad importante)

### 3. **Enriquecimiento de Datos**
**Estado**: 0% completo

**Qué falta**:
- ❌ Crear `services/enrichmentService.ts`
- ❌ Integración con APIs externas (Clearbit, Apollo, LinkedIn)
- ❌ Enriquecimiento automático de companies y contacts
- ❌ UI para enriquecimiento manual
- ❌ Implementar en `app/api/cron/enrich/route.ts`

**Tiempo estimado**: 3-4 días

---

### 4. **Detección de Buying Signals**
**Estado**: 0% completo

**Qué falta**:
- ❌ Crear migración SQL para tabla `buying_signals`
- ❌ Lógica para detectar señales automáticamente
- ❌ Integración con APIs externas para detectar hiring, growth, etc.
- ❌ UI para ver y gestionar buying signals
- ❌ Integrar en `services/scoringEngine.ts` y `services/outboundEngine.ts`

**Tiempo estimado**: 2-3 días

---

### 5. **Activity Logs**
**Estado**: 10% completo - Tabla existe pero no se usa

**Qué falta**:
- ❌ Crear `services/activityLogger.ts`
- ❌ Logging de acciones del usuario
- ❌ Logging de acciones del sistema
- ❌ UI para ver historial de actividades
- ❌ Integrar en todos los servicios

**Tiempo estimado**: 2-3 días

---

## 🟢 MEDIA PRIORIDAD (Mejoras)

### 6. **Configuración de Cronjobs en Vercel**
- ❌ Crear `vercel.json` con configuración de cronjobs
- ❌ Configurar schedules para cada cronjob
- ❌ Validación de tokens de autorización para cronjobs

**Tiempo estimado**: 1 día

---

### 7. **Migración de Librerías Legacy**
- ❌ Migrar `app/api/analyze-relationships` a usar `relationshipEngine`
- ❌ Migrar `app/api/calculate-scores` a usar `scoringEngine`
- ❌ Eliminar archivos legacy en `/lib` cuando ya no se usen

**Tiempo estimado**: 1 día

---

### 8. **Mejoras de UX**
- ❌ Paginación en tablas grandes
- ❌ Búsqueda y filtros avanzados
- ❌ Exportación de datos (CSV, Excel)
- ❌ Notificaciones en tiempo real
- ❌ Dashboard con gráficos (Chart.js o Recharts)

**Tiempo estimado**: 3-4 días

---

### 9. **Optimizaciones**
- ❌ Caché para llamadas a OpenAI
- ❌ Optimización de queries a Supabase
- ❌ Lazy loading de componentes
- ❌ Code splitting

**Tiempo estimado**: 2-3 días

---

### 10. **Testing**
- ❌ Tests unitarios para servicios
- ❌ Tests de integración para APIs
- ❌ Tests E2E para flujos críticos

**Tiempo estimado**: 3-5 días

---

### 11. **Documentación**
- ❌ README.md principal con instrucciones de setup
- ❌ Documentación de API (Swagger/OpenAPI)
- ❌ Guía de deployment
- ❌ Documentación de variables de entorno

**Tiempo estimado**: 2-3 días

---

## 📊 Priorización Recomendada

### Sprint 1 (Semana 1) - Funcionalidad Core
1. ✅ ~~Conexión Frontend-Backend~~ (3-4 días)
2. ✅ ~~Configuración HubSpot por Account~~ (1-2 días)

**Resultado**: Aplicación funcional end-to-end

### Sprint 2 (Semana 2) - Features Importantes
3. Enriquecimiento de Datos (3-4 días)
4. Activity Logs (2-3 días)

**Resultado**: Datos enriquecidos y trazabilidad completa

### Sprint 3 (Semana 3) - Mejoras y Optimización
5. Buying Signals (2-3 días)
6. Mejoras de UX (3-4 días)
7. Optimizaciones (2-3 días)

**Resultado**: Producto pulido y optimizado

### Sprint 4 (Semana 4) - Calidad y Deployment
8. Testing (3-5 días)
9. Documentación (2-3 días)
10. Configuración Cronjobs (1 día)

**Resultado**: Producto listo para producción

---

## 🎯 Próximos Pasos Inmediatos

1. **Conectar Frontend con APIs** (3-4 días)
   - Crear hooks personalizados
   - Reemplazar datos mock
   - Implementar manejo de estados

2. **Configurar HubSpot por Account** (1-2 días)
   - UI de settings
   - Almacenamiento seguro de API keys

3. **Habilitar RLS en Supabase** (30 min)
   - Configurar en Supabase Dashboard
   - Probar que funciona correctamente

---

**Tiempo total estimado para MVP completo**: 20-30 días de desarrollo
