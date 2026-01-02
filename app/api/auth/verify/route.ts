import { NextResponse } from "next/server";
import { verificarAssinatura } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { email, senha } = await req.json();

        if (!email) {
            return NextResponse.json({
                ativo: false,
                message: "Email obrigatório"
            }, { status: 400 });
        }

        // 1. Verificar senha master (ADMIN)
        const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
        if (masterPassword && senha === masterPassword) {
            console.log(`👑 ADMIN LOGIN: ${email}`);
            return NextResponse.json({
                ativo: true,
                isAdmin: true,
                message: "Acesso admin liberado"
            });
        }

        // 2. Verificar senha VIP legada (para compatibilidade)
        const vipPassword = process.env.NEXT_PUBLIC_VIP_PASSWORD;
        if (vipPassword && senha === vipPassword) {
            console.log(`🔑 VIP PASSWORD LOGIN: ${email}`);
            return NextResponse.json({
                ativo: true,
                isLegacy: true,
                message: "Acesso VIP liberado (senha legada)"
            });
        }

        // 3. Verificar assinatura no Supabase
        const { ativo, assinante } = await verificarAssinatura(email);

        if (ativo) {
            console.log(`✅ Assinatura ATIVA: ${email}`);
            return NextResponse.json({
                ativo: true,
                assinante: {
                    email: assinante?.email,
                    status: assinante?.status,
                    data_inicio: assinante?.data_inicio
                },
                message: "Assinatura ativa"
            });
        } else {
            console.log(`❌ Assinatura INATIVA ou não encontrada: ${email}`);
            return NextResponse.json({
                ativo: false,
                message: "Assinatura não encontrada ou inativa"
            });
        }

    } catch (error: any) {
        console.error("❌ Erro na verificação:", error.message);
        return NextResponse.json({
            ativo: false,
            error: error.message
        }, { status: 500 });
    }
}
