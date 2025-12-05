'use client'

import React from 'react'
import ActionItem from '@/components/actions/ActionItem'

interface SuggestedAction {
  id: number
  tipo: 'bridge' | 'prospect' | 'outbound'
  empresa: string
  contacto: string
  diasSinActividad: number
  mensajeSugerido: string
  oportunidadId: number
}

export default function ActionsPage() {
  // TODO: Fetch acciones sugeridas desde API
  // const { data: actions } = await fetch('/api/actions/suggested')
  // O desde activity_logs:
  // const { data: actions } = await fetch('/api/activity_logs?type=follow_up&status=suggested')
  
  const suggestedActions: SuggestedAction[] = [
    {
      id: 1,
      tipo: 'bridge',
      empresa: 'TechCorp Solutions',
      contacto: 'María García',
      diasSinActividad: 12,
      mensajeSugerido: 'Hola María, hace unos días te pedí una intro con Juan Pérez de TechCorp. ¿Has podido hablar con él? Si necesitas más contexto sobre lo que hacemos, estaré encantado de compartirlo.',
      oportunidadId: 1,
    },
    {
      id: 2,
      tipo: 'prospect',
      empresa: 'InnovateLab',
      contacto: 'Carlos López',
      diasSinActividad: 8,
      mensajeSugerido: 'Hola Carlos, espero que estés bien. Quería hacer seguimiento de nuestra conversación anterior sobre cómo podríamos ayudar a InnovateLab. ¿Te parece bien si coordinamos una breve llamada esta semana?',
      oportunidadId: 2,
    },
    {
      id: 3,
      tipo: 'outbound',
      empresa: 'DataFlow Inc',
      contacto: 'Ana Martínez',
      diasSinActividad: 15,
      mensajeSugerido: 'Hola Ana, vi que DataFlow está creciendo en el sector de analytics. Hemos ayudado a empresas similares a optimizar sus procesos. ¿Te interesaría una breve conversación para ver si hay sinergias?',
      oportunidadId: 3,
    },
    {
      id: 4,
      tipo: 'bridge',
      empresa: 'CloudScale',
      contacto: 'Roberto Silva',
      diasSinActividad: 5,
      mensajeSugerido: 'Hola Roberto, gracias por la intro con el equipo de CloudScale. Quería hacer seguimiento para ver cómo va la evaluación. ¿Hay algo más que pueda compartir que les sea útil?',
      oportunidadId: 4,
    },
    {
      id: 5,
      tipo: 'prospect',
      empresa: 'StartupHub',
      contacto: 'Laura Fernández',
      diasSinActividad: 20,
      mensajeSugerido: 'Hola Laura, hace tiempo que no hablamos. Veo que StartupHub sigue creciendo. ¿Sigue siendo relevante explorar cómo podríamos trabajar juntos? Estaría encantado de retomar la conversación.',
      oportunidadId: 5,
    },
    {
      id: 6,
      tipo: 'outbound',
      empresa: 'Analytics Pro',
      contacto: 'Pedro Sánchez',
      diasSinActividad: 6,
      mensajeSugerido: 'Hola Pedro, espero que estés bien. Vi que Analytics Pro está expandiendo su equipo. Hemos trabajado con empresas similares y creo que podríamos aportar valor. ¿Te parece bien si coordinamos una llamada?',
      oportunidadId: 6,
    },
    {
      id: 7,
      tipo: 'bridge',
      empresa: 'Digital Solutions',
      contacto: 'Carmen Ruiz',
      diasSinActividad: 10,
      mensajeSugerido: 'Hola Carmen, quería hacer seguimiento de la intro que pedí con el equipo de Digital Solutions. ¿Has podido conectar con ellos? Si necesitas algo más de mi parte, estaré encantado de ayudar.',
      oportunidadId: 7,
    },
    {
      id: 8,
      tipo: 'prospect',
      empresa: 'TechStart',
      contacto: 'David Torres',
      diasSinActividad: 3,
      mensajeSugerido: 'Hola David, gracias por la conversación de la semana pasada. Quería compartirte un caso de estudio que creo que podría ser relevante para TechStart. ¿Te parece bien si te lo envío?',
      oportunidadId: 8,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Acciones sugeridas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Follow-ups recomendados por el motor de IA
        </p>
      </div>

      {/* Lista de acciones */}
      <div className="space-y-4">
        {suggestedActions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay acciones sugeridas en este momento
            </p>
          </div>
        ) : (
          suggestedActions.map((action) => (
            <ActionItem
              key={action.id}
              id={action.id}
              tipo={action.tipo}
              empresa={action.empresa}
              contacto={action.contacto}
              diasSinActividad={action.diasSinActividad}
              mensajeSugerido={action.mensajeSugerido}
              oportunidadId={action.oportunidadId}
            />
          ))
        )}
      </div>

      {/* Info adicional */}
      <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          <strong>Nota:</strong> Estas acciones son sugeridas automáticamente por el motor de IA basándose en la actividad y el tiempo transcurrido desde el último contacto. 
          Los mensajes son sugerencias que puedes personalizar antes de enviar.
        </p>
        <p className="text-xs text-primary-700 dark:text-primary-300 mt-2">
          TODO: Conectar con API de activity_logs para obtener acciones reales y actualizar estado después de ejecutarlas.
        </p>
      </div>
    </div>
  )
}

