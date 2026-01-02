import { NextResponse } from "next/server";
import { ativarAssinatura, cancelarAssinatura } from "@/lib/supabase";

// Webhook do Kiwify para processar eventos de assinatura
export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("📨 Webhook Kiwify recebido:", JSON.stringify(body, null, 2));

        // Extrair dados do webhook Kiwify
        const evento = body.order_status || body.event || body.tipo;
        const email = body.Customer?.email || body.customer?.email || body.email;
        const orderId = body.order_id || body.id;

        if (!email) {
            console.error("❌ Email não encontrado no webhook");
            return NextResponse.json({ error: "Email não encontrado" }, { status: 400 });
        }

        console.log(`📧 Email: ${email} | Evento: ${evento}`);

        // Processar diferentes eventos
        switch (evento?.toLowerCase()) {
            case "paid":
            case "approved":
            case "compra_aprovada":
            case "subscription_renewed":
            case "assinatura_renovada":
                // Ativar assinatura
                const ativado = await ativarAssinatura(email, orderId);
                if (ativado) {
                    console.log(`✅ Assinatura ATIVADA para ${email}`);
                    return NextResponse.json({ success: true, message: "Assinatura ativada" });
                } else {
                    console.error(`❌ Erro ao ativar assinatura para ${email}`);
                    return NextResponse.json({ error: "Erro ao ativar" }, { status: 500 });
                }

            case "refunded":
            case "chargedback":
            case "cancelled":
            case "subscription_cancelled":
            case "assinatura_cancelada":
            case "reembolso":
                // Cancelar assinatura
                const cancelado = await cancelarAssinatura(email);
                if (cancelado) {
                    console.log(`🚫 Assinatura CANCELADA para ${email}`);
                    return NextResponse.json({ success: true, message: "Assinatura cancelada" });
                } else {
                    console.error(`❌ Erro ao cancelar assinatura para ${email}`);
                    return NextResponse.json({ error: "Erro ao cancelar" }, { status: 500 });
                }

            default:
                console.log(`⚠️ Evento não processado: ${evento}`);
                return NextResponse.json({ message: "Evento ignorado", evento });
        }

    } catch (error: any) {
        console.error("❌ Erro no webhook:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Permitir GET para teste
export async function GET() {
    return NextResponse.json({
        status: "Webhook Kiwify ativo",
        timestamp: new Date().toISOString()
    });
}
