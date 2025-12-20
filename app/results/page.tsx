"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
            const parsed = JSON.parse(data);
            console.log("Loaded Analysis Result:", parsed);
            setResult(parsed);
        }
    }, []);

    const checkoutLinks: { [key: string]: string } = {
        "Oval": "https://pay.kiwify.com.br/jA1VCkP",
        "Redondo": "https://pay.kiwify.com.br/d2V0GRV",
        "Quadrado": "https://pay.kiwify.com.br/2NpS9yr",
        "Diamante": "https://pay.kiwify.com.br/mf92DQg",
        "Triangulo": "https://pay.kiwify.com.br/zUiaLx7",
        "Coracao": "https://pay.kiwify.com.br/yzdk5qo",
    };

    const handleCheckout = () => {
        if (!result) return;
        try {
            const faceShape = result.rosto?.formato_rosto || "default";
            const linkKey = Object.keys(checkoutLinks).find(key =>
                key.toLowerCase() === faceShape.toLowerCase()
            ) || "default";
            const checkoutUrl = checkoutLinks[linkKey] || "https://pay.kiwify.com.br/Ji56d15";
            window.location.href = checkoutUrl;
        } catch (error) {
            window.location.href = "https://pay.kiwify.com.br/Ji56d15";
        }
    };

    if (!result) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse text-primary font-mono">Carregando analise...</div>
            </main>
        );
    }

    const radarData = [
        { subject: 'SIMETRIA', A: result.grafico_radar?.simetria || 65, B: 95, fullMark: 100 },
        { subject: 'PELE', A: result.grafico_radar?.qualidade_pele || 70, B: 90, fullMark: 100 },
        { subject: 'ESTRUTURA', A: result.grafico_radar?.estrutura_ossea || 60, B: 98, fullMark: 100 },
        { subject: 'HARMONIA', A: result.grafico_radar?.harmonia_facial || 55, B: 92, fullMark: 100 },
        { subject: 'PROPORCAO', A: result.grafico_radar?.proporcao_aurea || 50, B: 96, fullMark: 100 },
    ];

    const currentScore = parseFloat(String(result.analise_geral?.nota_final || 6.2));
    const potentialScore = Math.min(10.0, parseFloat(String(result.analise_geral?.nota_potencial || (currentScore + 1.5))));
    const gap = (potentialScore - currentScore).toFixed(1);

    return (
        <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-primary selection:text-black">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            <Navbar />

            <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 space-y-16 relative z-10">

                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider border-l-4 border-primary pl-4">
                        ANALISE GERAL
                    </h2>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 md:p-12 pb-24 md:pb-32 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="relative space-y-12">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-400 font-medium text-sm tracking-wider uppercase">Sua Nota Atual</span>
                                        <span className="text-3xl text-white font-bold font-mono tracking-tighter">{currentScore}</span>
                                    </div>
                                    <div className="h-6 bg-gray-900 rounded-full overflow-hidden relative shadow-inner border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-gray-600 to-gray-400 rounded-full relative"
                                            style={{ width: `${(currentScore / 10) * 100}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/10" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 relative">
                                    <div className="flex justify-between items-end">
                                        <span className="text-primary font-bold text-sm tracking-wider uppercase drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">Seu Potencial Maximo</span>
                                        <span className="text-5xl text-primary font-black font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">{potentialScore}</span>
                                    </div>

                                    <div className="relative">
                                        <div className="h-8 bg-gray-900/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-primary shadow-[0_0_30px_rgba(57,255,20,0.3)] rounded-full relative transition-all duration-1000 ease-out"
                                                style={{ width: `${(potentialScore / 10) * 100}%` }}
                                            >
                                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_1s_infinite_linear]" />
                                            </div>
                                        </div>

                                        <div
                                            className="absolute top-full mt-4 flex flex-col items-center z-20"
                                            style={{ left: `${(currentScore / 10) * 100 + ((potentialScore - currentScore) / 20) * 100}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="w-px h-4 bg-gradient-to-b from-rose-500/50 to-rose-500 mb-1"></div>
                                            <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/30 px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-rose-300 font-medium uppercase tracking-wider leading-none mb-1">Potencial Desperdicado</span>
                                                    <span className="text-lg font-bold text-rose-500 font-mono leading-none">+{gap} PONTOS</span>
                                                </div>
                                                <ArrowUp className="w-5 h-5 text-rose-500 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                        ONDE ESTAO SEUS <span className="text-primary">PONTOS CEGOS</span>
                    </h2>

                    <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-4 relative" style={{ minHeight: '400px', width: '100%' }}>
                        {radarData && radarData.length > 0 && (
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Atual" dataKey="A" stroke="#ffffff" strokeWidth={2} fill="#ffffff" fillOpacity={0.1} />
                                    <Radar name="Potencial" dataKey="B" stroke="#39FF14" strokeWidth={3} strokeDasharray="4 4" fill="#39FF14" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-sm font-mono">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-white/20 border border-white rounded-full" />
                                <span className="text-gray-400">Atual</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary/20 border border-primary border-dashed rounded-full" />
                                <span className="text-primary font-bold">Potencial Genetico</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                        SEU <span className="text-primary">ARQUETIPO</span>
                    </h2>

                    <div className="relative max-w-sm mx-auto group cursor-pointer" onClick={() => alert("Tire um print para compartilhar!")}>
                        <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 shadow-[0_0_40px_rgba(57,255,20,0.1)] aspect-[9/16]">
                            {localStorage.getItem("faceImage") && (
                                <div className="absolute inset-0 z-0">
                                    <img src={localStorage.getItem("faceImage")!} alt="User Background" className="w-full h-full object-cover opacity-40 blur-xl scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                </div>
                            )}

                            <div className="relative z-10 h-full flex flex-col justify-between p-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                            <span className="text-xs font-mono text-primary tracking-widest">PRIME AI ANALYTICS</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic uppercase leading-none">
                                            {result.analise_geral?.arquetipo || (() => {
                                                const shape = result.rosto?.formato_rosto?.toLowerCase();
                                                if (shape?.includes('quadrado')) return "THE RULER";
                                                if (shape?.includes('diamante')) return "THE HUNTER";
                                                if (shape?.includes('oval')) return "THE NOBLE";
                                                if (shape?.includes('triangulo')) return "THE CREATOR";
                                                if (shape?.includes('coracao')) return "THE CHARMER";
                                                if (shape?.includes('redondo')) return "THE MYSTIC";
                                                return "THE MAVERICK";
                                            })()}
                                        </h3>
                                    </div>
                                    <ScanFace className="w-8 h-8 text-white/50" />
                                </div>

                                <div className="flex-1 flex items-center justify-center">
                                    <div className="relative w-48 h-48">
                                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                                        {localStorage.getItem("faceImage") ? (
                                            <img src={localStorage.getItem("faceImage")!} className="w-full h-full object-cover rounded-full grayscale contrast-150 border-4 border-white/10 mix-blend-luminosity" style={{ filter: 'brightness(0.7) contrast(1.5) grayscale(1)' }} />
                                        ) : (
                                            <User className="w-full h-full text-white/20" />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">{currentScore}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] text-gray-400 uppercase">Potencial</p>
                                            <p className="text-xl font-bold text-primary">{potentialScore}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] text-gray-400 uppercase">Raridade</p>
                                            <p className="text-xl font-bold text-white">TOP 5%</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-mono">prime-ai.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-10 left-0 right-0 text-center">
                            <p className="text-sm text-gray-400 flex items-center justify-center gap-2 animate-bounce">
                                <ArrowDown className="w-4 h-4" /> Tire um print para compartilhar
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white tracking-wider border-l-4 border-primary pl-4">
                        DIAGNOSTICO PRELIMINAR
                    </h2>

                    <div className="grid gap-4">
                        <div className="bg-white/5 border border-primary/30 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-5 h-5" />
                                <div>
                                    <h4 className="font-bold text-white">Formato do Rosto Detectado</h4>
                                    <p className="text-sm text-gray-400">{result?.rosto?.formato_rosto || "Analisando..."} - Analise Biometrica Concluida.</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">GRATIS</span>
                        </div>

                        {[
                            { label: "Erro Critico Detectado", icon: XCircle },
                            { label: "Sugestao de Maquiagem", icon: Star },
                            { label: "Corte de Cabelo Ideal", icon: User }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-3">
                                    <item.icon className="text-red-500 w-5 h-5" />
                                    <div>
                                        <h4 className="font-bold text-gray-300">{item.label}</h4>
                                        <p className="text-sm text-gray-500 font-mono blur-sm select-none">[CONTEUDO BLOQUEADO PELA IA]</p>
                                    </div>
                                </div>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="p-10 rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-primary/30 text-center space-y-8 relative overflow-hidden group shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                    <div className="absolute inset-0 opacity-5 mix-blend-overlay" />

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter italic transform -skew-x-6">
                            CHEGA DE SEGREDOS. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse">VOCE E VIP!</span>
                        </h2>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-lg mx-auto text-left space-y-3">
                            <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-4">O que esta incluso:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Relatorio Completo de Simetria
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Guia Glow Up (Cabelo e Maquiagem)
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Tutorial de Angulos para Fotos
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 relative z-10">
                        <Button
                            type="button"
                            size="lg"
                            className="w-full md:w-auto px-12 h-24 text-xl md:text-2xl font-black uppercase tracking-widest animate-pulse shadow-[0_0_60px_rgba(57,255,20,0.4)] hover:shadow-[0_0_100px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300 border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black"
                            onClick={handleCheckout}
                        >
                            DESBLOQUEAR MEU DOSSIE E ACESSO VIP AGORA
                            <Zap className="ml-3 w-8 h-8 fill-current" />
                        </Button>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-white">
                                De <span className="text-red-500 line-through decoration-2">R$ 97,00</span> por <span className="text-primary text-2xl">R$ 19,90</span>
                            </span>
                            <span className="text-xs text-gray-500 font-mono">(Oferta de Lancamento por Tempo Limitado)</span>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span>Garantia de 7 dias ou seu dinheiro de volta</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-70">
                            <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Pagamento Seguro
                            </div>
                            <span>-</span>
                            <div className="flex gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="font-bold">PIX</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
