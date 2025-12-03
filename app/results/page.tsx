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
    Zap,
    ArrowDown,
    ArrowUp
} from "lucide-react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

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

    // Data for Radar Chart
    const radarData = [
        { subject: 'SIMETRIA', A: 65, B: 95, fullMark: 100 },
        { subject: 'PELE', A: 70, B: 90, fullMark: 100 },
        { subject: 'ESTRUTURA ÓSSEA', A: 60, B: 98, fullMark: 100 },
        { subject: 'TERÇO MÉDIO', A: 55, B: 92, fullMark: 100 },
        { subject: 'PROPORÇÃO ÁUREA', A: 50, B: 96, fullMark: 100 },
    ];

    const currentScore = result.analise_geral?.nota_final || 6.2;
    const potentialScore = 9.4;
    const gap = (potentialScore - currentScore).toFixed(1);

    return (
        <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-primary selection:text-black">
            {/* Cyberpunk Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            <Navbar />

            <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 space-y-16 relative z-10">

                {/* TOP SECTION: ANÁLISE GERAL (Bar Chart) */}
                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider border-l-4 border-primary pl-4">
                        ANÁLISE GERAL
                    </h2>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="space-y-12">
                            {/* Bar 1: Current Score */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-gray-400 font-mono text-sm">
                                    <span>SUA NOTA ATUAL</span>
                                    <span className="text-2xl text-white font-bold">{currentScore}</span>
                                </div>
                                <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gray-500 rounded-full"
                                        style={{ width: `${(currentScore / 10) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Bar 2: Potential Score */}
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-end text-primary font-mono text-sm font-bold">
                                    <span className="drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]">SEU POTENCIAL</span>
                                    <span className="text-4xl text-primary drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]">{potentialScore}</span>
                                </div>
                                <div className="h-6 bg-gray-900/50 rounded-full overflow-hidden relative border border-primary/20">
                                    <div
                                        className="h-full bg-primary shadow-[0_0_20px_rgba(57,255,20,0.6)] rounded-full relative"
                                        style={{ width: `${(potentialScore / 10) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                </div>

                                {/* GAP ANNOTATION */}
                                <div className="absolute top-12 md:top-8 left-[70%] md:left-[80%] -translate-x-1/2 flex flex-col items-center animate-bounce duration-[2000ms]">
                                    <ArrowUp className="text-red-500 w-8 h-8 rotate-180 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                                    <div className="bg-red-500/10 border border-red-500/50 px-3 py-1 rounded text-red-500 text-xs font-bold font-mono whitespace-nowrap backdrop-blur-md">
                                        GAP DE BELEZA: {gap} PONTOS
                                        <br />
                                        <span className="text-[10px] opacity-80">(O que você está perdendo)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM SECTION: RADAR CHART */}
                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                        ONDE ESTÃO SEUS <span className="text-primary">PONTOS CEGOS</span>
                    </h2>

                    <div className="h-[400px] md:h-[500px] w-full bg-black/40 border border-white/5 rounded-3xl p-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }}
                                />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                                {/* Current Score Radar */}
                                <Radar
                                    name="Atual"
                                    dataKey="A"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    fill="#ffffff"
                                    fillOpacity={0.1}
                                />

                                {/* Potential Score Radar */}
                                <Radar
                                    name="Potencial"
                                    dataKey="B"
                                    stroke="#39FF14"
                                    strokeWidth={3}
                                    strokeDasharray="4 4"
                                    fill="#39FF14"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-sm font-mono">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-white/20 border border-white rounded-full" />
                                <span className="text-gray-400">Atual</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary/20 border border-primary border-dashed rounded-full" />
                                <span className="text-primary font-bold">Potencial Genético</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STRATEGIC CENSORSHIP SECTION */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white tracking-wider border-l-4 border-primary pl-4">
                        DIAGNÓSTICO PRELIMINAR
                    </h2>

                    <div className="grid gap-4">
                        {/* Free Insight */}
                        <div className="bg-white/5 border border-primary/30 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-5 h-5" />
                                <div>
                                    <h4 className="font-bold text-white">Formato dos Olhos</h4>
                                    <p className="text-sm text-gray-400">Amêndoa - Excelente simetria detectada.</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">GRÁTIS</span>
                        </div>

                        {/* Locked Insights */}
                        {[
                            { label: "Erro Crítico Detectado", icon: XCircle },
                            { label: "Sugestão de Maquiagem", icon: Star },
                            { label: "Corte de Cabelo Ideal", icon: User }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-3">
                                    <item.icon className="text-red-500 w-5 h-5" />
                                    <div>
                                        <h4 className="font-bold text-gray-300">{item.label}</h4>
                                        <p className="text-sm text-gray-500 font-mono blur-sm select-none">
                                            [CONTEÚDO BLOQUEADO PELA IA 🔒]
                                        </p>
                                    </div>
                                </div>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ACTION SECTION */}
                <div className="p-10 rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-primary/30 text-center space-y-8 relative overflow-hidden group shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                            DESBLOQUEIE SEU <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">DOSSIÊ PRIME AI</span>
                        </h2>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-lg mx-auto text-left space-y-3">
                            <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-4">O que está incluso:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Relatório Completo de Simetria
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Guia "Glow Up" (Cabelo & Maquiagem)
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Tutorial de Ângulos para Fotos
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 relative z-10">
                        <Button
                            size="lg"
                            className="w-full md:w-auto px-12 h-24 text-xl md:text-2xl font-black uppercase tracking-widest animate-pulse shadow-[0_0_60px_rgba(57,255,20,0.4)] hover:shadow-[0_0_100px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300 border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black"
                            onClick={handleCheckout}
                        >
                            DESBLOQUEAR MEU DOSSIÊ AGORA
                            <Zap className="ml-3 w-8 h-8 fill-current" />
                        </Button>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-white">
                                De <span className="text-red-500 line-through decoration-2">R$ 97,00</span> por <span className="text-primary text-2xl">R$ 19,90</span>
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                                (Oferta de Lançamento por Tempo Limitado)
                            </span>
                        </div>
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
