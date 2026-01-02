import { NextResponse } from "next/server";
import { verificarAssinatura } from "@/lib/supabase";
import {
    checkRateLimit,
    secureCompare,
    isAllowedAdmin,
    isValidEmail,
    getClientIP,
    sanitizeForLogs
} from "@/lib/security";

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Endpoint de Verificação de Acesso VIP - Versão Segura
 * 
 * PROTEÇÕES IMPLEMENTADAS:
 * ✅ Rate limiting (previne força bruta)
 * ✅ Comparação timing-safe de senhas
 * ✅ Lista de admins permitidos
 * ✅ Validação de email
 * ✅ Logs sanitizados
 */
export async function POST(req: Request) {
    const clientIP = getClientIP(req);

    // ==================== RATE LIMITING ====================
    // Mais restritivo para endpoint de autenticação: 5 tentativas por minuto
    const rateLimit = checkRateLimit(`auth:${clientIP}`, 5, 60000);

    if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limit de auth excedido: ${clientIP}`);
        return NextResponse.json(
            {
                ativo: false,
                error: "Muitas tentativas. Aguarde um momento."
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000))
                }
            }
        );
    }

    try {
        const { email, senha } = await req.json();

        // ==================== VALIDAÇÃO DE EMAIL ====================
        if (!email) {
            return NextResponse.json({
                ativo: false,
                message: "Email obrigatório"
            }, { status: 400 });
        }

        const emailNormalizado = email.toLowerCase().trim();

        if (!isValidEmail(emailNormalizado)) {
            return NextResponse.json({
                ativo: false,
                message: "Email inválido"
            }, { status: 400 });
        }

        // ==================== 1. VERIFICAR ADMIN (protegido) ====================
        const masterPassword = process.env.ADMIN_MASTER_PASSWORD;

        // Só permite admin se: (1) senha existe, (2) email está na lista permitida, (3) senha correta
        if (masterPassword && senha && isAllowedAdmin(emailNormalizado)) {
            if (secureCompare(senha, masterPassword)) {
                console.log(`👑 ADMIN: ${sanitizeForLogs(emailNormalizado)}`);
                return NextResponse.json({
                    ativo: true,
                    isAdmin: true,
                    message: "Acesso admin liberado"
                });
            }
        }

        // ==================== 2. VERIFICAR SENHA VIP (legado, protegido) ====================
        // NOTA: VIP_PASSWORD (sem NEXT_PUBLIC_) - não exposta no frontend
        const vipPassword = process.env.VIP_PASSWORD;

        if (vipPassword && senha) {
            if (secureCompare(senha, vipPassword)) {
                console.log(`🔑 VIP Legacy: ${sanitizeForLogs(emailNormalizado)}`);
                return NextResponse.json({
                    ativo: true,
                    isLegacy: true,
                    message: "Acesso VIP liberado"
                });
            }
        }

        // ==================== 3. VERIFICAR ASSINATURA NO SUPABASE ====================
        const { ativo, assinante } = await verificarAssinatura(emailNormalizado);

        if (ativo) {
            if (!IS_PRODUCTION) {
                console.log(`✅ Assinatura ativa: ${sanitizeForLogs(emailNormalizado)}`);
            }
            return NextResponse.json({
                ativo: true,
                assinante: {
                    email: assinante?.email,
                    status: assinante?.status,
                    data_inicio: assinante?.data_inicio
                },
                message: "Assinatura ativa"
            });
        }

        // ==================== ACESSO NEGADO ====================
        // Delay artificial para prevenir timing attacks e enumeration
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        if (!IS_PRODUCTION) {
            console.log(`❌ Acesso negado: ${sanitizeForLogs(emailNormalizado)}`);
        }

        return NextResponse.json({
            ativo: false,
            message: "Assinatura não encontrada ou inativa"
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("❌ Erro na verificação:", errorMessage);
        return NextResponse.json({
            ativo: false,
            error: "Erro ao verificar acesso"
        }, { status: 500 });
    }
}
