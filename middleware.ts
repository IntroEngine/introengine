import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Crear cliente de Supabase para middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Si no hay credenciales, permitir acceso (para desarrollo)
    return res
  }

  // Obtener token de las cookies
  const token = req.cookies.get('sb-access-token')?.value || 
                req.cookies.get('sb-refresh-token')?.value

  // Rutas protegidas (requieren autenticación)
  const protectedPaths = ['/dashboard', '/companies', '/contacts', '/opportunities', '/actions', '/weekly-summary']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Rutas de autenticación (no deben estar autenticados)
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname === path)

  // Para rutas protegidas, verificar si hay token
  // Nota: La verificación real se hará en las API routes usando getAuthUser()
  if (isProtectedPath && !token) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
