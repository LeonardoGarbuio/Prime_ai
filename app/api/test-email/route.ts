import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";
import { secureCompare } from "@/lib/security";

// Rota de teste de Email com Debug completo
// PROTEGIDO: Requer ?secret=SENHA_ADMIN
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const secret = searchParams.get("secret");
    const apiKey = process.env.BREVO_API_KEY;
    const adminPassword = process.env.ADMIN_MASTER_PASSWORD;

    // ========== AUTENTICAÇÃO ==========
    if (!adminPassword) {
        return NextResponse.json({ error: "Sistema não configurado corretamente" }, { status: 500 });
    }

    if (!secret || !secureCompare(secret, adminPassword)) {
        return NextResponse.json({
            error: "Acesso negado",
            hint: "Use ?secret=SENHA_ADMIN&email=SEU_EMAIL"
        }, { status: 401 });
    }

    // ========== VALIDAÇÃO ==========
    if (!email) {
        return NextResponse.json({ error: "Email obrigatório. Use ?email=seu@email.com&secret=SENHA" }, { status: 400 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: "BREVO_API_KEY não configurada no ambiente" }, { status: 500 });
    }

    console.log(`🔍 Testando envio para: ${email}`);
    console.log(`🔑 Key configurada: ${apiKey.substring(0, 5)}...`);

    const payload = {
        sender: {
            name: "Prime AI Debug",
            email: "leonardogarbuiocavalheiro@gmail.com"
        },
        to: [{ email: email, name: "Teste Debug" }],
        subject: "Teste de Diagnóstico Prime AI",
        htmlContent: "<h1>Isso é um teste</h1><p>Se você recebeu, a API está funcionando.</p>"
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

        const data = await response.json();

        return NextResponse.json({
            status: response.status,
            ok: response.ok,
            brevo_response: data,
            debug_info: {
                sender: payload.sender.email,
                to: email
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            error: "Falha na requisição fetch",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
