# 🚀 Guía de Deployment en Vercel

## Pasos para Deployar IntroEngine

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en GitHub:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta o inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Next.js

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ve a **Settings > Environment Variables** y agrega:

#### Variables Requeridas:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
OPENAI_API_KEY=sk-tu_openai_api_key
```

#### Variables Opcionales:
```
OPENAI_MODEL=gpt-4-turbo-preview
CLEARBIT_API_KEY=tu_clearbit_key
APOLLO_API_KEY=tu_apollo_key
HUBSPOT_API_KEY=tu_hubspot_key
CRON_SECRET=token_secreto_aleatorio
```

**Importante**: 
- Marca todas las variables para **Production**, **Preview** y **Development**
- `CRON_SECRET` es opcional pero recomendado para proteger los cronjobs

### 4. Deploy

1. Click en **"Deploy"**
2. Vercel construirá el proyecto automáticamente
3. Una vez completado, obtendrás una URL como: `https://introengine.vercel.app`

### 5. Configurar Base de Datos

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `schema.sql`
4. Ejecuta el script para crear todas las tablas

### 6. Verificar Cronjobs

Los cronjobs están configurados en `vercel.json` y se ejecutarán automáticamente:

- **Enriquecimiento**: Diario a las 2:00 AM UTC
- **Oportunidades**: Diario a las 6:00 AM UTC  
- **Resumen Semanal**: Lunes a las 8:00 AM UTC
- **HubSpot Sync**: Diario a las 12:00 PM UTC

**Nota**: El plan Hobby de Vercel solo permite cronjobs diarios. Si necesitas mayor frecuencia (ej: cada 6 horas), considera actualizar al plan Pro.

Puedes verificar su ejecución en **Vercel Dashboard > Functions > Cron Jobs**

### 7. Proteger Cronjobs (Opcional)

Si configuraste `CRON_SECRET`, los cronjobs están protegidos. Vercel automáticamente enviará el header `Authorization: Bearer <CRON_SECRET>` cuando ejecute los cronjobs.

## Verificación Post-Deployment

1. ✅ Verifica que la aplicación carga correctamente
2. ✅ Prueba el login/signup
3. ✅ Verifica que las APIs responden (ej: `/api/companies`)
4. ✅ Revisa los logs en Vercel Dashboard si hay errores

## Troubleshooting

### Error: "Supabase credentials not configured"
- Verifica que las variables de entorno están configuradas en Vercel
- Asegúrate de que tienen el prefijo correcto (`NEXT_PUBLIC_` para variables del cliente)

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` es válida
- Verifica que tienes créditos en tu cuenta de OpenAI

### Cronjobs no se ejecutan
- Los cronjobs solo funcionan en **producción** (no en preview deployments)
- Verifica que `vercel.json` está en el root del proyecto
- Revisa los logs en **Vercel Dashboard > Functions**

### Build falla
- Revisa los logs de build en Vercel
- Verifica que todas las dependencias están en `package.json`
- Asegúrate de que no hay errores de TypeScript (`npm run build` localmente)

## Comandos Útiles

```bash
# Deploy manual desde CLI
vercel

# Deploy a producción
vercel --prod

# Ver logs
vercel logs

# Ver variables de entorno
vercel env ls
```

## Siguiente Paso

Una vez desplegado, puedes:
1. Configurar un dominio personalizado en Vercel
2. Habilitar RLS en Supabase para mayor seguridad
3. Configurar alertas y monitoreo
