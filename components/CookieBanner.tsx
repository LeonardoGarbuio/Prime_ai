'use client';

import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

export default function CookieBanner() {
    const { consent, acceptCookies, rejectCookies } = useCookieConsent();

    // Se já respondeu, não mostra nada
    if (consent !== null) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-[300px] animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Usamos cookies para melhorar sua experiência e análise de tráfego.
                        Ao continuar, você concorda com nossa Política de Privacidade.
                    </p>
                    <button
                        onClick={rejectCookies}
                        className="text-gray-500 hover:text-white transition-colors"
                        aria-label="Rejeitar"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={acceptCookies}
                        size="sm"
                        className="flex-1 h-7 text-[10px] font-medium bg-white text-black hover:bg-gray-200"
                    >
                        Aceitar
                    </Button>
                    <Button
                        onClick={rejectCookies}
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-[10px] text-gray-400 hover:text-white"
                    >
                        Rejeitar
                    </Button>
                </div>
            </div>
        </div>
    );
}
