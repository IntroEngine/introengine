# 🔧 Troubleshooting - Error 404 en Vercel

## Error: `404: NOT_FOUND - DEPLOYMENT_NOT_FOUND`

Este error indica que Vercel no puede encontrar el deployment. Aquí están las soluciones:

## ✅ Soluciones Rápidas

### 1. Verificar Estado del Deployment

1. Ve a tu **Vercel Dashboard**
2. Selecciona tu proyecto
3. Ve a la pestaña **"Deployments"**
4. Verifica el estado del último deployment:
   - ✅ **Ready** = Deployment exitoso
   - ⏳ **Building** = Aún en proceso
   - ❌ **Error** = Falló el build

### 2. Si el Deployment Está en "Building"

- Espera a que termine (puede tardar 2-5 minutos)
- Refresca la página del dashboard
- Verifica los logs en tiempo real

### 3. Si el Deployment Falló

**Revisa los logs de build:**
1. Click en el deployment fallido
2. Ve a la pestaña **"Build Logs"**
3. Busca errores comunes:

#### Error: "Build failed"
- Verifica que todas las variables de entorno están configuradas
- Revisa errores de TypeScript o compilación
- Verifica que `package.json` tiene todas las dependencias

#### Error: "Module not found"
- Verifica que todos los archivos están en el repositorio
- Asegúrate de que `.gitignore` no está excluyendo archivos necesarios

#### Error: "Environment variables missing"
- Ve a **Settings > Environment Variables**
- Verifica que todas las variables requeridas están configuradas
- Asegúrate de marcarlas para **Production**, **Preview** y **Development**

### 4. Verificar la URL Correcta

La URL de tu deployment debería ser:
- `https://[nombre-proyecto].vercel.app`
- O tu dominio personalizado si lo configuraste

**No uses:**
- URLs de preview deployments (tienen hash)
- URLs antiguas de deployments eliminados

### 5. Re-deploy Manual

Si el deployment falló, intenta hacer un nuevo deploy:

**Opción A: Desde el Dashboard**
1. Ve a **Deployments**
2. Click en **"Redeploy"** en el último deployment
3. O crea un nuevo deployment desde **"Deploy"**

**Opción B: Desde Git**
```bash
# Hacer un pequeño cambio para trigger un nuevo deploy
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

**Opción C: Desde CLI**
```bash
vercel --prod
```

## 🔍 Verificaciones Adicionales

### Verificar Configuración del Proyecto

1. **Framework**: Debe estar configurado como "Next.js"
2. **Build Command**: `npm run build` (o dejar vacío para auto-detect)
3. **Output Directory**: `.next` (o dejar vacío para auto-detect)
4. **Install Command**: `npm install` (o dejar vacío)

### Verificar Variables de Entorno

Asegúrate de tener configuradas **al menos** estas variables:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ OPENAI_API_KEY
```

**Importante**: Marca todas para **Production**, **Preview** y **Development**

### Verificar Archivos en el Repositorio

Asegúrate de que estos archivos están en Git:

```
✅ package.json
✅ next.config.js
✅ vercel.json
✅ tsconfig.json
✅ app/ (directorio completo)
✅ components/ (directorio completo)
✅ services/ (directorio completo)
```

### Verificar Build Local

Antes de deployar, prueba el build localmente:

```bash
npm run build
```

Si falla localmente, también fallará en Vercel.

## 🚨 Errores Comunes y Soluciones

### Error: "Cannot find module"
**Solución**: Verifica que todas las dependencias están en `package.json` y ejecuta `npm install`

### Error: "TypeScript errors"
**Solución**: Ejecuta `npx tsc --noEmit` localmente y corrige los errores

### Error: "Missing environment variables"
**Solución**: Configura todas las variables en Vercel Dashboard > Settings > Environment Variables

### Error: "Build timeout"
**Solución**: El build está tardando demasiado. Considera optimizar el código o contactar soporte de Vercel

## 📞 Siguiente Paso

Si después de seguir estos pasos el problema persiste:

1. **Revisa los logs completos** en Vercel Dashboard
2. **Copia el error exacto** que aparece en los logs
3. **Verifica el estado del deployment** en la pestaña Deployments
4. Si es necesario, **contacta soporte de Vercel** con el ID del error

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] El deployment aparece en Vercel Dashboard
- [ ] El estado del deployment (Ready/Error/Building)
- [ ] Todas las variables de entorno están configuradas
- [ ] El build funciona localmente (`npm run build`)
- [ ] Estás usando la URL correcta del deployment
- [ ] El repositorio está conectado correctamente
- [ ] Los archivos necesarios están en Git
