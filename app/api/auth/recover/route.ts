import { NextResponse } from "next/server";
import { verificarAssinatura } from "@/lib/supabase";
import {
    checkRateLimit,
    isValidEmail,
    getClientIP,
    generateMagicToken,
    sanitizeForLogs
} from "@/lib/security";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://primeai-amber.vercel.app';

/**
 * Endpoint de Recuperação de Acesso VIP
 * 
 * Recebe email, verifica se é assinante ativo, e envia link mágico
 */
export async function POST(req: Request) {
    const clientIP = getClientIP(req);

    // Rate limiting agressivo: 3 tentativas por 5 minutos
    const rateLimit = checkRateLimit(`recover:${clientIP}`, 3, 5 * 60 * 1000);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            {
                success: false,
                message: "Muitas tentativas. Aguarde 5 minutos."
            },
            { status: 429 }
        );
    }

    try {
        const { email } = await req.json();

        // Validação de email
        if (!email) {
            return NextResponse.json({
                success: false,
                message: "Email obrigatório"
            }, { status: 400 });
        }

        const emailNormalizado = email.toLowerCase().trim();

        if (!isValidEmail(emailNormalizado)) {
            return NextResponse.json({
                success: false,
                message: "Email inválido"
            }, { status: 400 });
        }

        // Verificar se é assinante ativo
        const { ativo } = await verificarAssinatura(emailNormalizado);

        // IMPORTANTE: Sempre retorna sucesso para não expor quais emails estão cadastrados
        // (evita enumeração de usuários)
        if (!ativo) {
            console.log(`⚠️ Tentativa de recuperação para email não cadastrado: ${sanitizeForLogs(emailNormalizado)}`);
            // Delay artificial para simular envio
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            return NextResponse.json({
                success: true,
                message: "Se houver uma assinatura ativa com este email, você receberá um link de acesso."
            });
        }

        // Gerar token mágico (15 minutos de validade)
        const token = await generateMagicToken(emailNormalizado, 15 * 60 * 1000);
        const magicLink = `${BASE_URL}/api/auth/magic?token=${token}`;

        // Enviar email com link mágico
        try {
            const { sendEmail } = await import('@/lib/send-welcome-email');

            await sendEmail({
                email: emailNormalizado,
                subject: '🔑 Seu link de acesso VIP - Prime AI',
                htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #39FF14; font-size: 32px; margin: 0; letter-spacing: 4px;">PRIME AI</h1>
            <p style="color: #666; font-size: 12px; margin-top: 8px;">ACESSO VIP</p>
        </div>

        <div style="background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border-radius: 20px; padding: 40px; border: 1px solid rgba(57, 255, 20, 0.2);">
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">
                🔑 Link de Acesso
            </h2>
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Clique no botão abaixo para acessar sua área VIP. Este link expira em <strong style="color: #39FF14;">15 minutos</strong> e só pode ser usado uma vez.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;">
                    ACESSAR ÁREA VIP →
                </a>
            </div>

            <p style="color: #888; font-size: 12px; line-height: 1.6; margin-top: 30px;">
                Se você não solicitou este link, ignore este email. Sua conta está segura.
            </p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <p style="color: #444; font-size: 11px; margin-top: 20px;">
                © 2025 Prime AI. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
                `,
            });

            console.log(`✅ Link mágico enviado para ${sanitizeForLogs(emailNormalizado)}`);
        } catch (emailError) {
            console.error('❌ Erro ao enviar email:', emailError);
            return NextResponse.json({
                success: false,
                message: "Erro ao enviar email. Tente novamente."
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Se houver uma assinatura ativa com este email, você receberá um link de acesso."
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("❌ Erro na recuperação:", errorMessage);
        return NextResponse.json({
            success: false,
            message: "Erro ao processar solicitação"
        }, { status: 500 });
    }
}
