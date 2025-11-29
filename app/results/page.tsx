"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { BlurReveal } from "@/components/ui/BlurReveal";
import {
    Star,
    ScanFace,
    User,
    ShieldCheck,
    Lock,
    CheckCircle2,
    XCircle,
    CreditCard,
    Zap
} from "lucide-react";

export default function ResultsPage() {
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const data = localStorage.getItem("analysisResult");
        if (data) {
            setResult(JSON.parse(data));
        }
    }, []);

    const handleCheckout = () => {
        window.location.href = "https://pay.kiwify.com.br/Ji56d15";
    };

    if (!result) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse text-primary font-mono">Carregando análise...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Scientific Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            <Navbar />

            <div className="max-w-5xl mx-auto px-4 pt-32 pb-20 space-y-12 relative z-10">
                {/* Teaser Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono font-bold animate-bounce">
                        <Star className="w-4 h-4 fill-current" />
                        POTENCIAL GENÉTICO: {result.analise_geral?.potencial_genetico?.toUpperCase() || "ALTO"}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold">
                        SUA NOTA ATUAL: <span className="text-red-600">{result.analise_geral?.nota_final || "6.2"}</span>
                    </h1>

                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        {result.analise_geral?.resumo_brutal || "Detectamos falhas críticas na sua simetria e postura que estão sabotando sua estética."}
                    </p>
                </div>

                {/* Split Analysis Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Face Card */}
                    <BlurReveal
                        title="ANÁLISE FACIAL"
                        description="Desbloqueie a análise detalhada da sua simetria e pele."
                        onUnlock={handleCheckout}
                    >
                        <div className="p-8 space-y-6 bg-secondary/30 border border-white/10 rounded-2xl h-full hover:border-primary/30 transition-colors">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                                <ScanFace className="text-primary w-6 h-6" />
                                Análise Facial Detalhada
                            </h3>

                            <div className="space-y-4">
                                {result.rosto?.falhas_criticas?.slice(0, 2).map((falha: string, i: number) => (
                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-gray-300 text-sm">{falha}</span>
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                ))}
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Análise de Pele</span>
                                    <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/10">
                                        <Lock className="w-3 h-3" /> BLOQUEADO
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Simetria Óssea</span>
                                    <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/10">
                                        <Lock className="w-3 h-3" /> BLOQUEADO
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Canthal Tilt</span>
                                    <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/10">
                                        <Lock className="w-3 h-3" /> BLOQUEADO
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BlurReveal>

                    {/* Body Card */}
                    <BlurReveal
                        title="PROTOCOLO CORPORAL"
                        description="Acesse seu plano de correção postural e shape."
                        onUnlock={handleCheckout}
                    >
                        <div className="p-8 space-y-6 bg-secondary/30 border border-white/10 rounded-2xl h-full hover:border-primary/30 transition-colors">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                                <User className="text-primary w-6 h-6" />
                                Análise Corporal & Postura
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Gordura Estimada</span>
                                    <span className="text-white font-mono">{result.corpo_postura?.gordura_estimada || "Calculando..."}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Análise Postural</span>
                                    <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/10">
                                        <Lock className="w-3 h-3" /> BLOQUEADO
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Estrutura Óssea</span>
                                    <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/10">
                                        <Lock className="w-3 h-3" /> BLOQUEADO
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-gray-300">Simetria de Ombros</span>
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                        </div>
                    </BlurReveal>
                </div>

                {/* Action Section */}
                <div className="p-10 rounded-3xl bg-gradient-to-b from-secondary/80 to-black border border-white/10 text-center space-y-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            NÃO ACEITE SUA GENÉTICA ATUAL.
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Seu plano personalizado contém 3 passos práticos para corrigir suas falhas em 30 dias.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 relative z-10">
                        <Button
                            size="lg"
                            className="w-full md:w-auto px-12 h-20 text-xl font-bold uppercase tracking-wide animate-pulse shadow-[0_0_40px_rgba(57,255,20,0.4)] hover:shadow-[0_0_60px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300"
                            onClick={handleCheckout}
                        >
                            CORRIGIR MINHAS FALHAS AGORA
                            <Zap className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                        <span className="text-sm font-mono text-primary/80">
                            Oferta por tempo limitado: Apenas R$ 19,90
                        </span>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span>Garantia de 7 dias ou seu dinheiro de volta</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-70">
                            <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Pagamento Seguro
                            </div>
                            <span>•</span>
                            <div className="flex gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="font-bold">PIX</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
