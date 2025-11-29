import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ScanLine, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
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

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            DESCUBRA O QUÃO LONGE <br />
            VOCÊ ESTÁ DO SEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">PRIME</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-400 md:text-xl">
            A inteligência artificial que julga sua simetria, detecta falhas e cria
            o plano exato para você atingir seu potencial genético máximo.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/scan">
              <Button size="lg" className="group text-lg h-16 px-12">
                ESCANEAR AGORA
                <ScanLine className="w-5 h-5 ml-2 group-hover:animate-pulse" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-600 font-mono">
            ANÁLISE CRIPTOGRAFADA • 100% PRIVADO • RESULTADO EM 30S
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t border-white/5 bg-secondary/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: ScanLine,
              title: "Análise Geométrica",
              desc: "Mapeamento facial de 78 pontos para calcular sua simetria e proporções áureas."
            },
            {
              icon: Zap,
              title: "Plano de Correção",
              desc: "Receba um protocolo prático para corrigir assimetrias, postura e falhas estéticas."
            },
            {
              icon: ShieldCheck,
              title: "Privacidade Total",
              desc: "Suas fotos são analisadas pela IA e deletadas imediatamente. Ninguém vê."
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
