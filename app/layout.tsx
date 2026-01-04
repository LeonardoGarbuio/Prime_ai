import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import TrackingPixels from "@/components/TrackingPixels";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://primeai.app'),
  title: {
    default: "PRIME AI - Análise Biométrica Facial com IA",
    template: "%s | Prime AI"
  },
  description: "Descubra o quão longe você está do seu Prime. Análise facial avançada com inteligência artificial que revela sua verdadeira pontuação estética.",
  keywords: [
    "análise facial",
    "análise facial ia",
    "biometria facial",
    "inteligência artificial",
    "beleza",
    "simetria facial",
    "prime",
    "scanner facial",
    "análise estética",
    "formato de rosto"
  ],
  authors: [{ name: "Prime AI" }],
  creator: "Prime AI",
  publisher: "Prime AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: "PRIME AI - Análise Biométrica Facial com IA",
    description: "A IA descobriu minhas falhas. Qual a sua nota? Descubra agora com análise facial avançada.",
    siteName: "Prime AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prime AI - Análise Facial com IA"
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "PRIME AI - Análise Biométrica Facial",
    description: "A IA descobriu minhas falhas. Qual a sua nota? Descubra agora.",
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Organization structured data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Prime AI",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://primeai.app",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://primeai.app"}/logo.png`,
    "description": "Análise biométrica facial avançada com inteligência artificial.",
    "sameAs": [
      "https://instagram.com/primeai",
      "https://facebook.com/primeai",
      "https://twitter.com/primeai"
    ]
  };

  return (
    <html lang="pt-BR">
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://primeai.app"} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <TrackingPixels />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
