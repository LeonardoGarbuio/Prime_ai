'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type CookieConsentContextType = {
    consent: boolean | null; // null = ainda não respondeu
    acceptCookies: () => void;
    rejectCookies: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
    const [consent, setConsent] = useState<boolean | null>(null);

    useEffect(() => {
        // Verifica se já existe escolha salva
        const savedConsent = localStorage.getItem('prime_ai_cookie_consent');
        if (savedConsent === 'true') {
            setConsent(true);
        } else if (savedConsent === 'false') {
            setConsent(false);
        } else {
            setConsent(null); // Mostra o banner
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('prime_ai_cookie_consent', 'true');
        setConsent(true);
    };

    const rejectCookies = () => {
        localStorage.setItem('prime_ai_cookie_consent', 'false');
        setConsent(false);
    };

    return (
        <CookieConsentContext.Provider value={{ consent, acceptCookies, rejectCookies }}>
            {children}
        </CookieConsentContext.Provider>
    );
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
}
