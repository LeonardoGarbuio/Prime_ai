"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ScanLine, ShieldCheck, Zap, Crown, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 overflow-hidden text-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            IA DE ANÁLISE ESTÉTICA AVANÇADA
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-8">
            DESCUBRA O QUÃO LONGE <br />
            VOCÊ ESTÁ DO SEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">PRIME</span>
          </h1>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="privacy"
                className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-black"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <label htmlFor="privacy" className="text-xs text-gray-400 cursor-pointer select-none">
                Li e concordo com os Termos de Uso e Política de Privacidade.
              </label>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Link href={acceptedPrivacy ? "/scan" : "#"}>
                <Button
                  size="lg"
                  className={`group text-lg h-16 px-8 transition-all duration-300 ${!acceptedPrivacy ? 'opacity-50 pointer-events-none' : ''}`}
                  disabled={!acceptedPrivacy}
                >
                  ESCANEAR AGORA
                  <ScanLine className="w-5 h-5 ml-2 group-hover:animate-pulse" />
                </Button>
              </Link>

              <Link href="/vip-scanner">
                <Button
                  size="lg"
                  className="group text-lg h-16 px-12 font-bold bg-primary hover:bg-primary/90 text-black transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                >
                  VIP
                  <Crown className="w-5 h-5 ml-2 fill-current" />
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-xs text-gray-600 font-mono">
            ANÁLISE CRIPTOGRAFADA • 100% PRIVADO • RESULTADO EM 30S <br />
            *Resultados baseados em geometria. Podem variar conforme iluminação.
          </p>
        </div>



        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Descubra o Clube Prime</span>
          <ArrowRight className="w-4 h-4 text-primary rotate-90" />
        </div>
      </section>

      {/* VIP Access Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-yellow-900/10 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wider uppercase">
            <Crown className="w-3 h-3" /> Clube Prime AI
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Leve sua imagem para o <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600">Próximo Nível</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Desbloqueie o acesso completo ao scanner VIP, receba seu guia de estilo personalizado e descubra os segredos para maximizar sua atratividade.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto mt-8">
            {[
              "Análise Facial Detalhada (Forensic + Stylist)",
              "Guia de Estilo & Cabelo Personalizado",
              "Acesso Mensal à Área de Membros VIP"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-sm text-gray-200 font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <Link href="/vip-scanner">
              <Button
                size="lg"
                className="h-16 px-12 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_50px_rgba(234,179,8,0.4)] transition-all transform hover:-translate-y-1"
              >
                DESBLOQUEAR ACESSO VIP
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-4">
              Apenas R$ 19,90 / mês • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main >
  );
}
