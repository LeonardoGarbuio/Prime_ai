import { createClient } from '@supabase/supabase-js';

// Cliente público (para frontend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com permissões elevadas (para backend/webhooks)
export function createServiceClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
    return createClient(supabaseUrl, serviceKey);
}

// Tipos
export interface Assinante {
    id: string;
    email: string;
    status: 'ativo' | 'cancelado' | 'pendente';
    kiwify_id?: string;
    data_inicio: string;
    data_fim?: string;
    created_at: string;
}

// Funções auxiliares
export async function verificarAssinatura(email: string): Promise<{ ativo: boolean; assinante?: Assinante }> {
    const { data, error } = await supabase
        .from('assinantes')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    if (error || !data) {
        return { ativo: false };
    }

    return {
        ativo: data.status === 'ativo',
        assinante: data as Assinante
    };
}

export async function ativarAssinatura(email: string, kiwifyId?: string): Promise<boolean> {
    const serviceClient = createServiceClient();

    const { error } = await serviceClient
        .from('assinantes')
        .upsert({
            email: email.toLowerCase(),
            status: 'ativo',
            kiwify_id: kiwifyId,
            data_inicio: new Date().toISOString(),
            data_fim: null
        }, {
            onConflict: 'email'
        });

    return !error;
}

export async function cancelarAssinatura(email: string): Promise<boolean> {
    const serviceClient = createServiceClient();

    const { error } = await serviceClient
        .from('assinantes')
        .update({
            status: 'cancelado',
            data_fim: new Date().toISOString()
        })
        .eq('email', email.toLowerCase());

    return !error;
}
