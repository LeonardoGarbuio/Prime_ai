import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";

// Rota de teste para enviar email (REMOVER em produção ou proteger)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email obrigatório. Use ?email=seu@email.com" }, { status: 400 });
    }

    const enviado = await sendWelcomeEmail({ email, nome: "Teste VIP" });

    if (enviado) {
        return NextResponse.json({ success: true, message: `Email enviado para ${email}` });
    } else {
        return NextResponse.json({ error: "Erro ao enviar email. Verifique a BREVO_API_KEY." }, { status: 500 });
    }
}
