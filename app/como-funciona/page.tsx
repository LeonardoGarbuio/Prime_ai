"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import {
    ScanLine, Zap, ShieldCheck, ArrowRight, Upload,
    Brain, Target, Sparkles, Eye, Ruler, CheckCircle2
} from "lucide-react";

export default function ComoFuncionaPage() {
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [showTermsWarning, setShowTermsWarning] = useState(false);

    const handleAnalyzeClick = (e: React.MouseEvent) => {
        if (!acceptedPrivacy) {
            e.preventDefault();
            setShowTermsWarning(true);
            setTimeout(() => setShowTermsWarning(false), 3000);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Modal de Aviso */}
            {showTermsWarning && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setShowTermsWarning(false)}
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[scaleIn_0.2s_ease-out]">
                        <div className="px-8 py-6 rounded-2xl bg-black border border-primary/50 shadow-[0_0_40px_rgba(57,255,20,0.15)] text-center max-w-sm">
                            <p className="text-lg font-medium text-white mb-2">Aceite os termos</p>
                            <p className="text-sm text-gray-400">
                                Você deve aceitar os <span className="text-primary">Termos de Uso</span> e a <span className="text-primary">Política de Privacidade</span> antes de continuar.
                            </p>
                            <button
                                onClick={() => setShowTermsWarning(false)}
                                className="mt-5 px-6 py-2 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-colors"
                            >
                                ENTENDI
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
                        <Eye className="w-3 h-3" /> ENTENDA O PROCESSO
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        COMO <span className="text-primary">FUNCIONA</span>
                    </h1>

                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Uma análise facial completa usando inteligência artificial avançada para revelar
                        seu potencial estético e fornecer insights personalizados.
                    </p>
                </div>
            </section>

            {/* 3 Passos Principais */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Passo 1 */}
                        <div className="relative group">
                            <div className="absolute -top-4 -left-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-black text-2xl shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                                1
                            </div>
                            <div className="p-8 pt-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-all h-full">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Envie sua Foto</h3>
                                <p className="text-gray-400 leading-relaxed mb-4">
                                    Faça upload de uma selfie com boa iluminação. Seu rosto deve estar visível,
                                    de frente e sem óculos para uma análise precisa.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Iluminação natural
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Rosto de frente
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Sem filtros
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Passo 2 */}
                        <div className="relative group">
                            <div className="absolute -top-4 -left-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-black text-2xl shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                                2
                            </div>
                            <div className="p-8 pt-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-all h-full">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Brain className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">IA Processa</h3>
                                <p className="text-gray-400 leading-relaxed mb-4">
                                    Nossa IA avançada mapeia 468 pontos faciais usando tecnologia MediaPipe
                                    e calcula proporções, simetria e harmonia facial.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> 468 pontos mapeados
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Proporção áurea
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Análise de simetria
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Passo 3 */}
                        <div className="relative group">
                            <div className="absolute -top-4 -left-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-black text-2xl shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                                3
                            </div>
                            <div className="p-8 pt-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-all h-full">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Target className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Receba Resultados</h3>
                                <p className="text-gray-400 leading-relaxed mb-4">
                                    Em segundos, você recebe sua nota facial, arquétipo, pontos fortes,
                                    pontos de atenção e dicas personalizadas de melhoria.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Nota de 0 a 10
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Arquétipo facial
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Dicas de visagismo
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* O Que Analisamos */}
            <section className="py-20 px-4 bg-gradient-to-b from-black to-primary/5 border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            O QUE <span className="text-primary">ANALISAMOS</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Cada aspecto do seu rosto é avaliado com precisão científica.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Ruler, title: "Proporções", desc: "Índice facial e proporção áurea" },
                            { icon: Sparkles, title: "Simetria", desc: "Comparação lado esquerdo x direito" },
                            { icon: Eye, title: "Estrutura", desc: "Mandíbula, zigomas e queixo" },
                            { icon: ScanLine, title: "Formato", desc: "Oval, quadrado, redondo, etc" },
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tecnologia */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono mb-4">
                                <Zap className="w-3 h-3" /> TECNOLOGIA
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Powered by <span className="text-primary">AI</span>
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Utilizamos uma combinação de tecnologias de ponta para garantir
                                análises precisas e resultados confiáveis:
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium">MediaPipe Face Mesh</span>
                                        <p className="text-sm text-gray-500">468 pontos faciais mapeados em tempo real</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium">Google Gemini</span>
                                        <p className="text-sm text-gray-500">IA generativa para análise visual avançada</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium">Antropometria Facial</span>
                                        <p className="text-sm text-gray-500">Cálculos baseados em padrões científicos</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                                <div className="text-center">
                                    <div className="text-7xl font-bold text-primary mb-2">468</div>
                                    <div className="text-gray-400">Pontos Faciais</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="text-center p-4 rounded-xl bg-black/40">
                                        <div className="text-2xl font-bold text-white">30s</div>
                                        <div className="text-xs text-gray-500">Tempo médio</div>
                                    </div>
                                    <div className="text-center p-4 rounded-xl bg-black/40">
                                        <div className="text-2xl font-bold text-white">95%</div>
                                        <div className="text-xs text-gray-500">Precisão</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Pronto para <span className="text-primary">descobrir</span>?
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Faça sua análise agora e descubra seu potencial. É rápido, seguro e gratuito.
                    </p>

                    {/* Checkbox de Termos */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            id="privacy-cta"
                            className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-black cursor-pointer"
                            checked={acceptedPrivacy}
                            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                        />
                        <label htmlFor="privacy-cta" className="text-xs text-gray-400 cursor-pointer select-none">
                            Li e concordo com os <span className="text-primary">Termos de Uso</span> e <span className="text-primary">Política de Privacidade</span>.
                        </label>
                    </div>

                    <Link href={acceptedPrivacy ? "/scan" : "#"} onClick={handleAnalyzeClick}>
                        <Button
                            size="lg"
                            className="h-16 px-12 text-lg font-bold shadow-[0_0_30px_rgba(57,255,20,0.2)] hover:shadow-[0_0_50px_rgba(57,255,20,0.4)] transition-all"
                        >
                            FAZER MINHA ANÁLISE
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
