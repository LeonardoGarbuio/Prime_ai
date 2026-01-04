import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-black text-gray-500 py-10 border-t border-gray-900 text-sm">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Lado Esquerdo: Marca e Copyright */}
                    <div className="text-center md:text-left">
                        <h3 className="text-white font-bold text-lg tracking-wider mb-2">PRIME AI</h3>
                        <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
                    </div>

                    {/* Centro: Links Legais (Obrigatórios) */}
                    <div className="flex gap-6 font-medium">
                        <Link href="/terms" className="hover:text-green-400 transition-colors">
                            Termos de Uso
                        </Link>
                        <Link href="/privacy" className="hover:text-green-400 transition-colors">
                            Privacidade
                        </Link>
                    </div>

                    {/* Lado Direito: Informação Legal */}
                    <div className="text-center md:text-right text-xs text-gray-600">
                        <p>Operado no Brasil 🇧🇷</p>
                        <p className="mt-2 text-[10px] opacity-60">
                            Este site não possui vínculo com o Facebook, Instagram ou TikTok.
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    );
}
