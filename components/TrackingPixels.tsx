'use client';

import Script from 'next/script';

// IDs dos Pixels (configurar no .env ou diretamente aqui)
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export function FacebookPixel() {
    if (!FB_PIXEL_ID) return null;

    return (
        <>
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${FB_PIXEL_ID}');
                        fbq('track', 'PageView');
                    `,
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    );
}

export function GoogleAnalytics() {
    if (!GA_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_ID}');
                    `,
                }}
            />
        </>
    );
}

// Funções para disparar eventos
export function trackEvent(eventName: string, params?: Record<string, any>) {
    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', eventName, params);
    }

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
    }
}

// Eventos comuns pré-definidos
export const AnalyticsEvents = {
    // Quando inicia análise
    startAnalysis: () => trackEvent('InitiateCheckout', { content_name: 'Face Analysis' }),

    // Quando completa análise
    completeAnalysis: (score: number) => trackEvent('ViewContent', {
        content_name: 'Analysis Result',
        value: score
    }),

    // Quando clica em comprar VIP
    clickVIP: () => trackEvent('AddToCart', {
        content_name: 'Prime AI VIP',
        value: 19.90,
        currency: 'BRL'
    }),

    // Quando efetua compra (disparar via webhook)
    purchase: (email: string) => trackEvent('Purchase', {
        content_name: 'Prime AI VIP',
        value: 19.90,
        currency: 'BRL'
    }),
};

// Componente combinado para usar no layout
export default function TrackingPixels() {
    // Importado dinamicamente para evitar erro de hook no servidor se não fosse 'use client'
    // Mas como este arquivo já é 'use client', podemos usar hooks diretos se estivermos dentro do Provider
    // Porém, TrackingPixels é usado no layout root, então precisamos garantir que temos acesso ao contexto
    // UMA ABORDAGEM MELHOR: TrackingPixelsContainer

    return (
        <TrackingPixelsContent />
    );
}

function TrackingPixelsContent() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useCookieConsent } = require('@/contexts/CookieConsentContext');
        const { consent } = useCookieConsent();

        if (consent !== true) return null;

        return (
            <>
                <FacebookPixel />
                <GoogleAnalytics />
            </>
        );
    } catch {
        // Fallback seguro se contexto não existir (não renderiza)
        return null;
    }
}

