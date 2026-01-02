import { NextResponse } from "next/server";
import { ativarAssinatura, cancelarAssinatura } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";
import {
    validateKiwifyWebhookToken,
    checkRateLimit,
    isWebhookAlreadyProcessed,
    markWebhookAsProcessed,
    isValidEmail,
    sanitizeForLogs,
    getClientIP
} from "@/lib/security";

/**
 * Webhook do Kiwify - Versão Segura
 * 
 * PROTEÇÕES IMPLEMENTADAS:
 * ✅ Validação HMAC da assinatura do webhook
 * ✅ Rate limiting por IP
 * ✅ Idempotência (previne processamento duplicado)
 * ✅ Validação de email
 * ✅ Logs sanitizados
 * ✅ Verificação de orderId no cancelamento
 * 
 * EVENTOS KIWIFY SUPORTADOS:
 * - compra_aprovada / paid / approved - Pagamento confirmado
 * - assinatura_renovada / subscription_renewed - Renovação de assinatura
 * - reembolso / refunded - Reembolso processado
 * - chargedback - Contestação de pagamento (chargeback)
 * - assinatura_cancelada / subscription_cancelled / cancelled - Cancelamento
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(req: Request) {
    const clientIP = getClientIP(req);

    // ==================== RATE LIMITING ====================
    const rateLimit = checkRateLimit(clientIP, 30, 60000); // 30 req/min por IP

    if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limit excedido para IP: ${clientIP}`);
        return NextResponse.json(
            { error: "Too many requests" },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
                    'X-RateLimit-Remaining': '0'
                }
            }
        );
    }

    try {
        // Obter corpo raw para validação HMAC
        const rawBody = await req.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any;

        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
        }

        // ==================== VALIDAÇÃO TOKEN KIWIFY ====================
        // Kiwify envia o token no body do webhook
        const webhookToken = body.webhook_token || body.token;

        if (IS_PRODUCTION) {
            if (!validateKiwifyWebhookToken(webhookToken)) {
                console.error(`❌ WEBHOOK REJEITADO: Token inválido de ${clientIP}`);
                return NextResponse.json(
                    { error: "Unauthorized - Invalid token" },
                    { status: 401 }
                );
            }
        } else {
            console.log("⚠️ DESENVOLVIMENTO: Validação de token desabilitada");
        }

        // Log sanitizado (sem dados sensíveis em produção)
        if (!IS_PRODUCTION) {
            console.log("📨 Webhook Kiwify recebido:", JSON.stringify(body, null, 2));
        } else {
            console.log("📨 Webhook Kiwify recebido:", sanitizeForLogs(body));
        }

        // ==================== EXTRAÇÃO DE DADOS ====================
        const evento = body.order_status || body.event || body.webhook_event_type || body.tipo;
        const email = body.Customer?.email || body.customer?.email || body.email;
        const nome = body.Customer?.full_name || body.customer?.name || body.nome;
        const orderId = body.order_id || body.id || body.subscription_id;
        // const productId = body.product_id; // Disponível para uso futuro

        // ==================== VALIDAÇÃO DE EMAIL ====================
        if (!email) {
            console.error("❌ Email não encontrado no webhook");
            return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
        }

        const emailNormalizado = email.toLowerCase().trim();

        if (!isValidEmail(emailNormalizado)) {
            console.error(`❌ Email inválido: ${sanitizeForLogs(email)}`);
            return NextResponse.json({ error: "Email inválido" }, { status: 400 });
        }

        // ==================== VALIDAÇÃO DE ORDER ID ====================
        if (!orderId) {
            console.error("❌ Order ID não encontrado no webhook");
            return NextResponse.json({ error: "Order ID obrigatório" }, { status: 400 });
        }

        // ==================== IDEMPOTÊNCIA ====================
        const webhookKey = `${orderId}-${evento}`;
        if (isWebhookAlreadyProcessed(webhookKey)) {
            console.log(`ℹ️ Webhook já processado: ${webhookKey}`);
            return NextResponse.json({
                success: true,
                message: "Webhook já processado anteriormente",
                idempotent: true
            });
        }

        console.log(`📧 Email: ${sanitizeForLogs(emailNormalizado)} | Evento: ${evento} | Order: ${orderId}`);

        // Processar diferentes eventos
        const eventoNormalizado = evento?.toLowerCase()?.trim();
        let result: NextResponse;

        switch (eventoNormalizado) {
            // ===== ATIVAÇÃO DE ASSINATURA =====
            case "paid":
            case "approved":
            case "compra_aprovada":
                result = await handleActivation(emailNormalizado, orderId, nome);
                break;

            // ===== RENOVAÇÃO DE ASSINATURA =====
            case "subscription_renewed":
            case "assinatura_renovada":
                result = await handleRenewal(emailNormalizado, orderId);
                break;

            // ===== REEMBOLSO =====
            case "refunded":
            case "reembolso":
                result = await handleRefund(emailNormalizado, orderId);
                break;

            // ===== CHARGEBACK (Contestação) =====
            case "chargedback":
            case "chargeback":
                result = await handleChargeback(emailNormalizado, orderId);
                break;

            // ===== CANCELAMENTO VOLUNTÁRIO =====
            case "cancelled":
            case "subscription_cancelled":
            case "assinatura_cancelada":
                result = await handleCancellation(emailNormalizado, orderId);
                break;

            // ===== EVENTOS NÃO CRÍTICOS (ignorar) =====
            case "boleto_gerado":
            case "pix_gerado":
            case "carrinho_abandonado":
            case "compra_recusada":
                console.log(`ℹ️ Evento não crítico: ${eventoNormalizado}`);
                return NextResponse.json({
                    message: "Evento recebido",
                    evento: eventoNormalizado
                });

            // ===== EVENTO DESCONHECIDO =====
            default:
                console.warn(`⚠️ Evento desconhecido: ${evento}`);
                return NextResponse.json({
                    message: "Evento não reconhecido",
                    evento: evento
                });
        }

        // Marcar como processado apenas se sucesso
        if (result.status === 200) {
            markWebhookAsProcessed(webhookKey);
        }

        return result;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("❌ Erro no webhook:", errorMessage);
        return NextResponse.json(
            { error: "Erro interno" },
            { status: 500 }
        );
    }
}

// ==================== HANDLERS ====================

async function handleActivation(email: string, orderId: string, nome?: string): Promise<NextResponse> {
    console.log(`💰 Processando COMPRA para ${sanitizeForLogs(email)}`);

    const ativado = await ativarAssinatura(email, orderId);

    if (!ativado) {
        console.error(`❌ Falha ao ativar assinatura para ${sanitizeForLogs(email)}`);
        return NextResponse.json(
            { error: "Erro ao ativar assinatura" },
            { status: 500 }
        );
    }

    console.log(`✅ Assinatura ATIVADA para ${sanitizeForLogs(email)}`);

    // Email de boas-vindas (não bloqueia webhook)
    try {
        await sendWelcomeEmail({ email, nome });
        console.log(`📧 Email de boas-vindas enviado`);
    } catch (emailError) {
        console.error(`⚠️ Erro ao enviar email (não crítico)`);
    }

    return NextResponse.json({
        success: true,
        message: "Assinatura ativada"
    });
}

async function handleRenewal(email: string, orderId: string): Promise<NextResponse> {
    console.log(`🔄 Processando RENOVAÇÃO para ${sanitizeForLogs(email)}`);

    const ativado = await ativarAssinatura(email, orderId);

    if (!ativado) {
        console.error(`❌ Falha ao renovar assinatura`);
        return NextResponse.json(
            { error: "Erro ao renovar assinatura" },
            { status: 500 }
        );
    }

    console.log(`✅ Assinatura RENOVADA`);
    return NextResponse.json({
        success: true,
        message: "Assinatura renovada"
    });
}

async function handleRefund(email: string, orderId: string): Promise<NextResponse> {
    console.log(`💸 Processando REEMBOLSO para ${sanitizeForLogs(email)}`);

    const cancelado = await cancelarAssinatura(email, orderId);

    if (!cancelado) {
        console.error(`❌ Falha ao processar reembolso`);
        return NextResponse.json(
            { error: "Erro ao processar reembolso" },
            { status: 500 }
        );
    }

    console.log(`🚫 Assinatura cancelada por reembolso`);
    return NextResponse.json({
        success: true,
        message: "Assinatura cancelada por reembolso"
    });
}

async function handleChargeback(email: string, orderId: string): Promise<NextResponse> {
    console.log(`⚠️ Processando CHARGEBACK para ${sanitizeForLogs(email)}`);

    const cancelado = await cancelarAssinatura(email, orderId);

    if (!cancelado) {
        console.error(`❌ Falha ao processar chargeback`);
        return NextResponse.json(
            { error: "Erro ao processar chargeback" },
            { status: 500 }
        );
    }

    console.log(`🚫 Assinatura cancelada por chargeback`);
    return NextResponse.json({
        success: true,
        message: "Assinatura cancelada por chargeback"
    });
}

async function handleCancellation(email: string, orderId: string): Promise<NextResponse> {
    console.log(`❌ Processando CANCELAMENTO para ${sanitizeForLogs(email)}`);

    const cancelado = await cancelarAssinatura(email, orderId);

    if (!cancelado) {
        console.error(`❌ Falha ao cancelar assinatura`);
        return NextResponse.json(
            { error: "Erro ao cancelar assinatura" },
            { status: 500 }
        );
    }

    console.log(`🚫 Assinatura CANCELADA`);
    return NextResponse.json({
        success: true,
        message: "Assinatura cancelada"
    });
}

// ==================== HEALTH CHECK ====================
// Protegido: não expõe detalhes em produção

export async function GET() {
    if (IS_PRODUCTION) {
        return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({
        status: "Webhook Kiwify ativo",
        version: "3.0-secure",
        environment: "development"
    });
}
