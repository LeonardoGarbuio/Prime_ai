import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Módulo Supabase - Versão Segura
 * 
 * PROTEÇÕES IMPLEMENTADAS:
 * ✅ Falha explícita quando não configurado (sem simulação)
 * ✅ Verificação de orderId no cancelamento
 * ✅ Validação de dados
 * ✅ Logs controlados
 */

// Tipos
export interface Assinante {
    id: string;
    email: string;
    status: 'ativo' | 'cancelado' | 'expirado';
    kiwify_id?: string;
    data_inicio: string;
    data_fim?: string;
    created_at: string;
}

// Cliente Supabase (lazy loading)
let supabaseClient: SupabaseClient | null = null;
let supabaseConfigured: boolean | null = null;

function getSupabaseClient(): SupabaseClient | null {
    if (supabaseConfigured === false) {
        return null;
    }

    if (!supabaseClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ CRÍTICO: Supabase não configurado - variáveis de ambiente ausentes');
            supabaseConfigured = false;
            return null;
        }

        supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        supabaseConfigured = true;
    }
    return supabaseClient;
}

/**
 * Verifica se o Supabase está corretamente configurado
 */
export function isSupabaseConfigured(): boolean {
    getSupabaseClient();
    return supabaseConfigured === true;
}

/**
 * Verificar se email tem assinatura ativa
 */
export async function verificarAssinatura(email: string): Promise<{ ativo: boolean; assinante?: Assinante }> {
    const supabase = getSupabaseClient();

    if (!supabase) {
        console.error('❌ Não é possível verificar assinatura: Supabase não configurado');
        return { ativo: false };
    }

    if (!email || typeof email !== 'string') {
        console.error('❌ Email inválido para verificação');
        return { ativo: false };
    }

    try {
        const { data, error } = await supabase
            .from('assinantes')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('status', 'ativo')
            .single();

        if (error) {
            // PGRST116 = registro não encontrado (não é erro)
            if (error.code !== 'PGRST116') {
                console.error('❌ Erro ao consultar assinatura:', error.code);
            }
            return { ativo: false };
        }

        return {
            ativo: data?.status === 'ativo',
            assinante: data as Assinante
        };
    } catch (error) {
        console.error('❌ Exceção ao verificar assinatura');
        return { ativo: false };
    }
}

/**
 * Ativar assinatura
 * IMPORTANTE: Falha explicitamente se Supabase não está configurado
 */
export async function ativarAssinatura(email: string, kiwifyId?: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    // ❌ NÃO SIMULA SUCESSO - Falha explicitamente
    if (!supabase) {
        console.error('❌ FALHA CRÍTICA: Não é possível ativar assinatura - Supabase não configurado');
        return false;
    }

    if (!email || typeof email !== 'string') {
        console.error('❌ Email inválido para ativação');
        return false;
    }

    const emailNormalizado = email.toLowerCase().trim();

    try {
        const { error } = await supabase
            .from('assinantes')
            .upsert({
                email: emailNormalizado,
                status: 'ativo',
                kiwify_id: kiwifyId || null,
                data_inicio: new Date().toISOString(),
                data_fim: null, // Limpa data_fim ao ativar
            }, {
                onConflict: 'email'
            });

        if (error) {
            console.error('❌ Erro ao ativar assinatura:', error.message);
            return false;
        }

        console.log(`✅ Assinatura ativada: ${emailNormalizado.substring(0, 3)}***`);
        return true;
    } catch (error) {
        console.error('❌ Exceção ao ativar assinatura');
        return false;
    }
}

/**
 * Cancelar assinatura
 * IMPORTANTE: Verifica se orderId corresponde ao registro (quando fornecido)
 */
export async function cancelarAssinatura(email: string, orderId?: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    // ❌ NÃO SIMULA SUCESSO - Falha explicitamente
    if (!supabase) {
        console.error('❌ FALHA CRÍTICA: Não é possível cancelar assinatura - Supabase não configurado');
        return false;
    }

    if (!email || typeof email !== 'string') {
        console.error('❌ Email inválido para cancelamento');
        return false;
    }

    const emailNormalizado = email.toLowerCase().trim();

    try {
        // Se orderId fornecido, verificar se corresponde ao registro
        if (orderId) {
            const { data: existing } = await supabase
                .from('assinantes')
                .select('kiwify_id, status')
                .eq('email', emailNormalizado)
                .single();

            if (existing) {
                // Se já tem registro com kiwify_id diferente, rejeitar
                if (existing.kiwify_id && existing.kiwify_id !== orderId) {
                    console.error(`❌ Segurança: orderId não corresponde ao registro`);
                    console.error(`❌ Esperado: ${existing.kiwify_id}, Recebido: ${orderId}`);
                    return false;
                }

                // Se já está cancelado, retorna sucesso (idempotência)
                if (existing.status === 'cancelado') {
                    console.log(`ℹ️ Assinatura já estava cancelada`);
                    return true;
                }
            }
        }

        const { error } = await supabase
            .from('assinantes')
            .update({
                status: 'cancelado',
                data_fim: new Date().toISOString(),
            })
            .eq('email', emailNormalizado);

        if (error) {
            console.error('❌ Erro ao cancelar assinatura:', error.message);
            return false;
        }

        console.log(`🚫 Assinatura cancelada: ${emailNormalizado.substring(0, 3)}***`);
        return true;
    } catch (error) {
        console.error('❌ Exceção ao cancelar assinatura');
        return false;
    }
}

/**
 * Verificar se orderId corresponde ao email
 * Útil para validações adicionais de segurança
 */
export async function verificarOrderIdPertenceAoEmail(email: string, orderId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    if (!supabase) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('assinantes')
            .select('kiwify_id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error || !data) {
            return false;
        }

        return data.kiwify_id === orderId;
    } catch {
        return false;
    }
}
