import { NextResponse } from "next/server";
import { validateMagicToken } from "@/lib/security";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://primeai-amber.vercel.app';

/**
 * Endpoint de Magic Link
 * 
 * Valida o token e redireciona para área VIP com sessão ativa
 */
export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return redirectWithError('Link inválido. Solicite um novo.');
    }

    // Validar token
    const { valid, email, error } = validateMagicToken(token);

    if (!valid || !email) {
        return redirectWithError(error || 'Link inválido');
    }

    // Token válido! Criar resposta com redirect + set cookie de sessão
    const response = NextResponse.redirect(`${BASE_URL}/vip-scanner?auth=success`);

    // Definir cookie de autenticação (expira em 7 dias)
    response.cookies.set('vip_session', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
        path: '/'
    });

    // Também salvar email no cookie acessível pelo frontend
    response.cookies.set('vip_email', email, {
        httpOnly: false, // Acessível pelo JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
    });

    console.log(`✅ Magic link validado para ${email.substring(0, 3)}***`);

    return response;
}

function redirectWithError(message: string) {
    const errorUrl = new URL('/vip-scanner', process.env.NEXT_PUBLIC_BASE_URL || 'https://primeai-amber.vercel.app');
    errorUrl.searchParams.set('error', message);
    return NextResponse.redirect(errorUrl.toString());
}
