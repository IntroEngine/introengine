-- ============================================================================
-- IntroEngine - Schema SQL para Supabase (Postgres)
-- SaaS B2B multi-tenant para detección de intros y oportunidades de outbound
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TRIGGER GENÉRICO PARA updated_at
-- ============================================================================

-- Función que actualiza el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLA: accounts
-- Propósito: Representa una cuenta/cliente del SaaS (empresa usuaria de IntroEngine)
-- Multi-tenant: Esta es la tabla raíz del tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    employee_range TEXT,
    plan TEXT DEFAULT 'standard' CHECK (plan IN ('standard', 'premium', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por dominio (útil para onboarding)
CREATE INDEX idx_accounts_domain ON public.accounts(domain) WHERE domain IS NOT NULL;

-- Índice para filtrar cuentas activas
CREATE INDEX idx_accounts_is_active ON public.accounts(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER trigger_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see their own account" ON public.accounts
--     FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE account_id = accounts.id));

-- ============================================================================
-- TABLA: users
-- Propósito: Usuarios dentro de una cuenta (personas que usan IntroEngine)
-- Multi-tenant: Vinculado a accounts mediante account_id
-- Nota: Se integrará con auth de Supabase en el futuro
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_users_account_id ON public.users(account_id);

-- Índice para búsquedas por email (autenticación)
CREATE INDEX idx_users_email ON public.users(email);

-- Índice para filtrar usuarios activos por cuenta
CREATE INDEX idx_users_account_active ON public.users(account_id, is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see users in their account" ON public.users
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: companies
-- Propósito: Empresas objetivo a las que se quiere vender (targets comerciales)
-- Multi-tenant: Vinculado a accounts mediante account_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    domain TEXT,
    country TEXT,
    industry TEXT,
    size_bucket TEXT CHECK (size_bucket IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('import', 'manual', 'api', 'linkedin', 'enrichment')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'qualified', 'won', 'lost', 'archived')),
    hubspot_company_id TEXT,
    enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
    enrichment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_companies_account_id ON public.companies(account_id);

-- Índice para búsquedas por domain (útil para deduplicación y enriquecimiento)
CREATE INDEX idx_companies_domain ON public.companies(domain) WHERE domain IS NOT NULL;

-- Índice para búsquedas por status (filtros comunes en dashboard)
CREATE INDEX idx_companies_status ON public.companies(account_id, status);

-- Índice para búsquedas por hubspot_company_id (sincronización)
CREATE INDEX idx_companies_hubspot_id ON public.companies(hubspot_company_id) WHERE hubspot_company_id IS NOT NULL;

-- Índice para enriquecimiento (buscar pendientes)
CREATE INDEX idx_companies_enrichment_status ON public.companies(account_id, enrichment_status) WHERE enrichment_status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see companies in their account" ON public.companies
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: contacts
-- Propósito: Personas que conoce el usuario o que están vinculadas a empresas target
-- Pueden ser contactos puente (friends, ex compañeros) o contactos objetivo (decisores)
-- Multi-tenant: Vinculado a accounts mediante account_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    linkedin_url TEXT,
    role_title TEXT,
    seniority TEXT CHECK (seniority IN ('owner', 'c-level', 'director', 'manager', 'staff', 'other')),
    type TEXT DEFAULT 'unknown' CHECK (type IN ('bridge', 'target', 'unknown')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('import', 'manual', 'linkedin', 'api', 'enrichment')),
    hubspot_contact_id TEXT,
    enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
    enrichment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_contacts_account_id ON public.contacts(account_id);

-- Índice para búsquedas por company_id (relación con empresas)
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id) WHERE company_id IS NOT NULL;

-- Índice para búsquedas por email (deduplicación y búsquedas)
CREATE INDEX idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;

-- Índice para búsquedas por type (filtrar puentes vs objetivos)
CREATE INDEX idx_contacts_type ON public.contacts(account_id, type);

-- Índice para búsquedas por hubspot_contact_id (sincronización)
CREATE INDEX idx_contacts_hubspot_id ON public.contacts(hubspot_contact_id) WHERE hubspot_contact_id IS NOT NULL;

-- Índice para enriquecimiento (buscar pendientes)
CREATE INDEX idx_contacts_enrichment_status ON public.contacts(account_id, enrichment_status) WHERE enrichment_status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see contacts in their account" ON public.contacts
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: contact_relationships
-- Propósito: Representa relaciones entre contactos (para intros de 1er y 2º nivel)
-- Ejemplo: Nacho (contact_id_1) conoce a Pablo (contact_id_2)
-- Multi-tenant: Vinculado a accounts mediante account_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    contact_id_1 UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    contact_id_2 UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'knows' CHECK (relationship_type IN ('knows', 'worked_together', 'ex_colleague', 'friend', 'family', 'other')),
    strength INTEGER DEFAULT 3 CHECK (strength >= 1 AND strength <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint para evitar relaciones duplicadas (bidireccionales)
    CONSTRAINT unique_relationship UNIQUE (contact_id_1, contact_id_2),
    -- Constraint para evitar auto-relaciones
    CONSTRAINT no_self_relationship CHECK (contact_id_1 != contact_id_2)
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_contact_relationships_account_id ON public.contact_relationships(account_id);

-- Índice para búsquedas por contact_id_1 (buscar relaciones desde un contacto)
CREATE INDEX idx_contact_relationships_contact_1 ON public.contact_relationships(contact_id_1);

-- Índice para búsquedas por contact_id_2 (buscar relaciones hacia un contacto)
CREATE INDEX idx_contact_relationships_contact_2 ON public.contact_relationships(contact_id_2);

-- Índice compuesto para búsquedas bidireccionales (detectar intros)
CREATE INDEX idx_contact_relationships_bidirectional ON public.contact_relationships(account_id, contact_id_1, contact_id_2);

-- Índice para filtrar por strength (intros más fuertes primero)
CREATE INDEX idx_contact_relationships_strength ON public.contact_relationships(account_id, strength DESC);

-- Trigger para updated_at
CREATE TRIGGER trigger_contact_relationships_updated_at
    BEFORE UPDATE ON public.contact_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see relationships in their account" ON public.contact_relationships
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: opportunities
-- Propósito: Oportunidades de intro u outbound generadas por el motor IA
-- Multi-tenant: Vinculado a accounts mediante account_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    target_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    bridge_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('intro', 'outbound')),
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'intro_requested', 'in_progress', 'contacted', 'qualified', 'won', 'lost', 'archived')),
    hubspot_deal_id TEXT,
    suggested_intro_message TEXT,
    suggested_outbound_message TEXT,
    last_action_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_opportunities_account_id ON public.opportunities(account_id);

-- Índice para búsquedas por company_id (oportunidades por empresa)
CREATE INDEX idx_opportunities_company_id ON public.opportunities(company_id);

-- Índice para búsquedas por target_contact_id (oportunidades por contacto objetivo)
CREATE INDEX idx_opportunities_target_contact ON public.opportunities(target_contact_id);

-- Índice para búsquedas por bridge_contact_id (oportunidades con puente)
CREATE INDEX idx_opportunities_bridge_contact ON public.opportunities(bridge_contact_id) WHERE bridge_contact_id IS NOT NULL;

-- Índice para búsquedas por status (filtros comunes en dashboard y pipeline)
CREATE INDEX idx_opportunities_status ON public.opportunities(account_id, status);

-- Índice para búsquedas por type (filtrar intros vs outbound)
CREATE INDEX idx_opportunities_type ON public.opportunities(account_id, type);

-- Índice para búsquedas por hubspot_deal_id (sincronización)
CREATE INDEX idx_opportunities_hubspot_deal_id ON public.opportunities(hubspot_deal_id) WHERE hubspot_deal_id IS NOT NULL;

-- Índice para ordenar por fecha de última acción (oportunidades más activas)
CREATE INDEX idx_opportunities_last_action ON public.opportunities(account_id, last_action_at DESC NULLS LAST);

-- Trigger para updated_at
CREATE TRIGGER trigger_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see opportunities in their account" ON public.opportunities
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: scores
-- Propósito: Contiene los distintos scores calculados por la IA para cada oportunidad
-- Multi-tenant: Vinculado indirectamente a accounts mediante opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    industry_fit_score INTEGER NOT NULL CHECK (industry_fit_score >= 0 AND industry_fit_score <= 100),
    buying_signal_score INTEGER NOT NULL CHECK (buying_signal_score >= 0 AND buying_signal_score <= 100),
    intro_strength_score INTEGER NOT NULL CHECK (intro_strength_score >= 0 AND intro_strength_score <= 100),
    lead_potential_score INTEGER NOT NULL CHECK (lead_potential_score >= 0 AND lead_potential_score <= 100),
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint para una sola fila de scores por oportunidad (última versión)
    CONSTRAINT unique_opportunity_score UNIQUE (opportunity_id)
);

-- Índice para búsquedas por opportunity_id (relación con oportunidades)
CREATE INDEX idx_scores_opportunity_id ON public.scores(opportunity_id);

-- Índice para ordenar por lead_potential_score (oportunidades más prometedoras)
-- Nota: Este índice se puede usar con JOIN a opportunities para filtrar por account_id
CREATE INDEX idx_scores_lead_potential ON public.scores(lead_potential_score DESC);

-- Índice compuesto para búsquedas por múltiples scores (filtros avanzados)
CREATE INDEX idx_scores_composite ON public.scores(industry_fit_score, buying_signal_score, intro_strength_score, lead_potential_score);

-- Trigger para updated_at
CREATE TRIGGER trigger_scores_updated_at
    BEFORE UPDATE ON public.scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see scores for opportunities in their account" ON public.scores
--     FOR SELECT USING (opportunity_id IN (
--         SELECT id FROM public.opportunities 
--         WHERE account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid())
--     ));

-- ============================================================================
-- TABLA: activity_logs
-- Propósito: Registro de acciones del usuario y del sistema, para trazabilidad
-- Multi-tenant: Vinculado a accounts mediante account_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'intro_requested',
        'message_sent',
        'status_changed',
        'company_added',
        'contact_added',
        'relationship_added',
        'opportunity_created',
        'opportunity_accepted',
        'opportunity_rejected',
        'hubspot_synced',
        'enrichment_completed',
        'weekly_summary_generated',
        'settings_updated',
        'system_automated'
    )),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (multi-tenant)
CREATE INDEX idx_activity_logs_account_id ON public.activity_logs(account_id);

-- Índice para búsquedas por user_id (actividades de un usuario)
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;

-- Índice para búsquedas por opportunity_id (historial de una oportunidad)
CREATE INDEX idx_activity_logs_opportunity_id ON public.activity_logs(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- Índice para búsquedas por action_type (filtrar tipos de acciones)
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(account_id, action_type);

-- Índice para ordenar por fecha (actividades recientes primero)
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(account_id, created_at DESC);

-- Índice compuesto para búsquedas comunes (dashboard de actividades)
CREATE INDEX idx_activity_logs_dashboard ON public.activity_logs(account_id, created_at DESC, action_type);

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see activity logs in their account" ON public.activity_logs
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TABLA: settings
-- Propósito: Configuración por cuenta (onboarding y preferencias)
-- Multi-tenant: Una fila por cuenta (unique account_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
    primary_industry TEXT,
    target_roles TEXT[],
    avg_ticket_size NUMERIC(12, 2),
    sales_cycle_days INTEGER CHECK (sales_cycle_days > 0),
    tone TEXT DEFAULT 'friendly' CHECK (tone IN ('formal', 'direct', 'friendly', 'casual')),
    hubspot_api_key TEXT, -- Encriptado en el futuro
    hubspot_portal_id TEXT,
    openai_model TEXT DEFAULT 'gpt-4',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por account_id (aunque es unique, útil para JOINs)
CREATE INDEX idx_settings_account_id ON public.settings(account_id);

-- Trigger para updated_at
CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Comentado para implementación futura
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see settings for their account" ON public.settings
--     FOR SELECT USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- VISTAS ÚTILES (Opcional - para consultas comunes)
-- ============================================================================

-- Vista: Oportunidades con scores y detalles completos
CREATE OR REPLACE VIEW public.opportunities_with_scores AS
SELECT 
    o.id,
    o.account_id,
    o.company_id,
    o.target_contact_id,
    o.bridge_contact_id,
    o.type,
    o.status,
    o.hubspot_deal_id,
    o.suggested_intro_message,
    o.suggested_outbound_message,
    o.last_action_at,
    o.created_at,
    o.updated_at,
    s.industry_fit_score,
    s.buying_signal_score,
    s.intro_strength_score,
    s.lead_potential_score,
    (s.industry_fit_score + s.buying_signal_score + s.intro_strength_score + s.lead_potential_score) / 4.0 AS total_score
FROM public.opportunities o
LEFT JOIN public.scores s ON o.id = s.opportunity_id;

-- Vista: Contactos con información de empresa
CREATE OR REPLACE VIEW public.contacts_with_companies AS
SELECT 
    c.id,
    c.account_id,
    c.company_id,
    c.full_name,
    c.email,
    c.linkedin_url,
    c.role_title,
    c.seniority,
    c.type,
    c.source,
    c.hubspot_contact_id,
    c.created_at,
    c.updated_at,
    comp.name AS company_name,
    comp.domain AS company_domain,
    comp.industry AS company_industry,
    comp.status AS company_status
FROM public.contacts c
LEFT JOIN public.companies comp ON c.company_id = comp.id;

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

-- Para habilitar RLS en todas las tablas en el futuro:
-- ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Para crear políticas RLS, usar el patrón comentado en cada tabla como referencia.
