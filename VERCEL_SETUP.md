# ✅ Checklist de Deployment en Vercel

## 📋 Pre-Deployment Checklist

### ✅ Archivos Creados/Configurados

- [x] `vercel.json` - Configuración de cronjobs
- [x] `README.md` - Documentación principal
- [x] `DEPLOY.md` - Guía detallada de deployment
- [x] Validación de tokens en todos los cronjobs
- [x] `.env.example` - Template de variables de entorno (en README)

### 🔧 Configuración de Vercel

#### 1. Conectar Repositorio
- [ ] Push código a GitHub
- [ ] Conectar repositorio en Vercel
- [ ] Verificar que Vercel detecta Next.js automáticamente

#### 2. Variables de Entorno (Settings > Environment Variables)

**Requeridas:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `OPENAI_API_KEY`

**Opcionales:**
- [ ] `OPENAI_MODEL` (default: gpt-4-turbo-preview)
- [ ] `CLEARBIT_API_KEY`
- [ ] `APOLLO_API_KEY`
- [ ] `HUBSPOT_API_KEY`
- [ ] `CRON_SECRET` (recomendado)

**Importante:** Marca todas para Production, Preview y Development

#### 3. Base de Datos
- [ ] Ejecutar `schema.sql` en Supabase SQL Editor
- [ ] Verificar que todas las tablas se crearon correctamente

#### 4. Deploy
- [ ] Click en "Deploy" en Vercel
- [ ] Esperar a que el build complete
- [ ] Verificar que no hay errores en los logs

#### 5. Verificación Post-Deployment
- [ ] La aplicación carga correctamente
- [ ] Login/Signup funciona
- [ ] APIs responden (ej: `/api/companies`)
- [ ] Cronjobs están configurados (verificar en Functions > Cron Jobs)

## 🚀 Comandos Rápidos

```bash
# 1. Preparar código
git add .
git commit -m "Ready for Vercel deployment"
git push origin main

# 2. (Opcional) Deploy desde CLI
vercel login
vercel
vercel --prod
```

## 📝 Notas Importantes

1. **Cronjobs**: Solo funcionan en producción, no en preview deployments
2. **Variables de Entorno**: Las que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente
3. **CRON_SECRET**: Vercel automáticamente envía el header `Authorization: Bearer <CRON_SECRET>` cuando ejecuta cronjobs
4. **Build Time**: El primer build puede tardar 2-3 minutos

## 🔗 URLs Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **OpenAI Dashboard**: https://platform.openai.com

## ⚠️ Troubleshooting

Si algo falla:
1. Revisa los logs de build en Vercel
2. Verifica que todas las variables de entorno están configuradas
3. Asegúrate de que `schema.sql` se ejecutó en Supabase
4. Revisa la consola del navegador para errores del cliente

## ✅ Listo para Deploy

Una vez completado el checklist, tu aplicación estará lista y funcionando en producción.
