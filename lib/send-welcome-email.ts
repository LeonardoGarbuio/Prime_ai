interface WelcomeEmailParams {
    email: string;
    nome?: string;
    subject?: string;
    htmlContent?: string;
    replyTo?: { email: string; name?: string };
}

/**
 * Envia email usando a API da Brevo (antiga Sendinblue)
 * Documentação: https://developers.brevo.com/docs/send-a-transactional-email
 */
export async function sendEmail({ email, nome, subject, htmlContent, replyTo }: WelcomeEmailParams): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error('⚠️ BREVO_API_KEY não configurada - email não enviado');
        return false;
    }

    const payload = {
        sender: {
            name: "Prime AI",
            email: "noreply@useprime.ia.br" // Domínio autenticado no Brevo
        },
        to: [
            {
                email: email,
                name: nome || "Cliente VIP"
            }
        ],
        subject: subject || "Bem-vindo ao Prime AI VIP!",
        htmlContent: htmlContent || "<p>Bem-vindo!</p>",
        replyTo: replyTo || { email: "useprimeai@gmail.com", name: "Suporte Prime AI" } // Respostas vão pro Gmail
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erro API Brevo:', JSON.stringify(errorData, null, 2));
            return false;
        }

        const data = await response.json();
        console.log('✅ Email enviado via Brevo:', data);
        return true;

    } catch (error) {
        console.error('❌ Falha na conexão com Brevo:', error);
        return false;
    }
}

// Wrapper para manter compatibilidade com código existente de boas-vindas
export async function sendWelcomeEmail({ email, nome, senha }: { email: string; nome?: string; senha?: string }): Promise<boolean> {
    const firstName = nome?.split(' ')[0] || 'VIP';

    // Seção de credenciais (só aparece se tem senha)
    const credenciaisHTML = senha ? `
            <div style="background: rgba(57, 255, 20, 0.1); border: 1px solid rgba(57, 255, 20, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #39FF14; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px;">🔐 Suas Credenciais de Acesso</h3>
                <div style="background: #000; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">EMAIL:</p>
                    <p style="color: #fff; font-size: 16px; margin: 0; font-family: monospace;">${email}</p>
                </div>
                <div style="background: #000; padding: 15px; border-radius: 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">SENHA:</p>
                    <p style="color: #39FF14; font-size: 20px; margin: 0; font-family: monospace; letter-spacing: 3px; font-weight: bold;">${senha}</p>
                </div>
                <p style="color: #666; font-size: 11px; margin: 15px 0 0 0; text-align: center;">
                    ⚠️ Guarde esta senha em local seguro. Você precisará dela para acessar o Scanner VIP.
                </p>
            </div>
    ` : '';

    const html = `
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
            <p style="color: #666; font-size: 12px; margin-top: 8px;">ANÁLISE BIOMÉTRICA FACIAL</p>
        </div>

        <div style="background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border-radius: 20px; padding: 40px; border: 1px solid rgba(57, 255, 20, 0.2);">
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">
                Olá, ${firstName}! 🎉
            </h2>
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Sua assinatura <strong style="color: #39FF14;">VIP</strong> está ativa!
            </p>

            ${credenciaisHTML}
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Agora você tem acesso ilimitado a:
            </p>
            
            <ul style="color: #ccc; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 30px 0;">
                <li>✨ Análise cromática personalizada</li>
                <li>👔 Guia de vestuário exclusivo</li>
                <li>💇 Recomendações de cortes e estilos</li>
                <li>🎯 Dossiê completo de visagismo</li>
                <li>💪 Plano de ação de 30 dias</li>
                <li>♾️ Análises ilimitadas</li>
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://primeai-amber.vercel.app/vip-scanner" 
                   style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;">
                    ACESSAR SCANNER VIP →
                </a>
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <p style="color: #666; font-size: 12px; margin: 0;">
                Dúvidas? Responda este email.
            </p>
            <p style="color: #444; font-size: 11px; margin-top: 20px;">
                © 2025 Prime AI. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        email,
        nome,
        subject: "🎉 Bem-vindo ao Prime AI VIP!",
        htmlContent: html,
        replyTo: { email: "leonardogarbuiocavalheiro@gmail.com", name: "Suporte Prime AI" }
    });
}
