import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import CTASection from '@/components/marketing/CTASection'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header con Login */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">IntroEngine</h1>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="md">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Convierte tu red en una{' '}
              <span className="text-primary-600">máquina de demos</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Detecta intros calientes y oportunidades automáticamente usando tu propia red de contactos.
              Prioriza empresas con señales de compra y genera outbound inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Solicitar acceso
              </Button>
              <Button variant="secondary" size="lg">
                Ver cómo funciona
              </Button>
            </div>
          </div>

          {/* Dashboard Mock */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4" bordered>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Oportunidades activas</div>
                  <div className="text-2xl font-bold text-foreground">24</div>
                  <Badge variant="success" className="mt-2">+12%</Badge>
                </Card>
                <Card className="p-4" bordered>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Intros detectadas</div>
                  <div className="text-2xl font-bold text-foreground">8</div>
                  <Badge variant="info" className="mt-2">Esta semana</Badge>
                </Card>
                <Card className="p-4" bordered>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Empresas priorizadas</div>
                  <div className="text-2xl font-bold text-foreground">156</div>
                  <Badge variant="warning" className="mt-2">Revisar</Badge>
                </Card>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Intros calientes detectadas</h3>
                <div className="space-y-3">
                  {[
                    { empresa: 'TechCorp', contacto: 'Juan Pérez', score: 'Alto', tipo: 'Intro directa' },
                    { empresa: 'InnovateLab', contacto: 'María García', score: 'Medio', tipo: 'Conexión 2º grado' },
                    { empresa: 'StartupHub', contacto: 'Carlos López', score: 'Alto', tipo: 'Intro directa' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">{item.empresa}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{item.contacto} • {item.tipo}</div>
                      </div>
                      <Badge variant={item.score === 'Alto' ? 'success' : 'warning'}>
                        {item.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tres pasos simples para transformar tu red en oportunidades de negocio
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Subís tus empresas y contactos',
                description: 'Conecta tu CRM o importa tus listas. IntroEngine analiza tu red completa de contactos y empresas objetivo.',
                icon: (
                  <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'El motor detecta intros, outbound y prioridades',
                description: 'Nuestro agente inteligente analiza conexiones, señales de compra y oportunidades. Te muestra dónde hay intros calientes y qué empresas priorizar.',
                icon: (
                  <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Todo se vuelca a HubSpot y trabajás desde tu pipeline',
                description: 'Las oportunidades detectadas se sincronizan automáticamente con HubSpot. Trabajás desde tu pipeline habitual sin cambiar tus procesos.',
                icon: (
                  <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
            ].map((item, idx) => (
              <Card key={idx} hover className="text-center">
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-primary-600 mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Beneficios
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Más resultados con menos esfuerzo
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Más intros calientes, menos frío',
                description: 'Detecta automáticamente conexiones en tu red que pueden generar intros de calidad. Deja de hacer outreach frío.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: 'text-success-600',
              },
              {
                title: 'Menos tiempo haciendo research',
                description: 'El agente analiza empresas, contactos y señales de compra por ti. Enfócate en cerrar, no en investigar.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'text-primary-600',
              },
              {
                title: 'Mejor foco semanal',
                description: 'Te dice exactamente dónde apretar cada semana. Prioriza empresas con más probabilidades de cerrar.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: 'text-accent-600',
              },
            ].map((benefit, idx) => (
              <Card key={idx} hover className="text-center">
                <div className={`flex justify-center mb-4 ${benefit.color}`}>
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién es */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Para quién es IntroEngine
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Diseñado para equipos B2B que quieren vender más inteligentemente
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'CEOs de pymes B2B',
                description: 'Fundadores que necesitan generar más oportunidades sin aumentar el equipo de ventas.',
                icon: '👔',
              },
              {
                title: 'SDRs / Closers',
                description: 'Equipos de ventas que quieren priorizar mejor y aumentar su tasa de conversión.',
                icon: '🎯',
              },
              {
                title: 'Consultores y agencias',
                description: 'Profesionales que gestionan múltiples clientes y necesitan optimizar su proceso de prospección.',
                icon: '💼',
              },
            ].map((target, idx) => (
              <Card key={idx} hover className="text-center">
                <div className="text-4xl mb-4">{target.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {target.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {target.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <CTASection
        title="¿Listo para convertir tu red en demos?"
        subtitle="Únete a los equipos que ya están usando IntroEngine para priorizar mejor y cerrar más."
        showForm={true}
      />

      {/* Footer simple */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 IntroEngine. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
