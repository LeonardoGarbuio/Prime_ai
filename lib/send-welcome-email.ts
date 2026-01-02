import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailParams {
    email: string;
    nome?: string;
}

export async function sendWelcomeEmail({ email, nome }: WelcomeEmailParams): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY não configurada - email não enviado');
        return false;
    }

    const firstName = nome?.split(' ')[0] || 'VIP';

    try {
        const { data, error } = await resend.emails.send({
            from: 'Prime AI <onboarding@resend.dev>',
            to: email,
            subject: '🎉 Bem-vindo ao Prime AI VIP!',
            html: `
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
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Agora você tem acesso ilimitado a:
            </p>
            
            <ul style="color: #ccc; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 30px 0;">
                <li>✨ Análise cromática personalizada</li>
                <li>👔 Guia de vestuário exclusivo</li>
                <li>💇 Recomendações de cortes e estilos</li>
                <li>🎯 Dossiê completo de visagismo</li>
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
            `,
        });

        if (error) {
            console.error('❌ Erro ao enviar email:', error);
            return false;
        }

        console.log('✅ Email de boas-vindas enviado:', data);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return false;
    }
}
