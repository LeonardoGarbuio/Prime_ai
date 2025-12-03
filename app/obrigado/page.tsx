"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Mail, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function ObrigadoPage() {
    useEffect(() => {
        // Trigger confetti on load
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-black flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-8 animate-fade-in">

                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        PAGAMENTO <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CONFIRMADO!</span>
                    </h1>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                                <Mail className="w-5 h-5 text-primary" />
                                Verifique seu E-mail
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                O seu <strong>Dossiê Prime AI</strong> já foi enviado para o e-mail cadastrado na compra.
                                <br />
                                <span className="text-xs text-gray-500">(Verifique também a caixa de Spam ou Promoções)</span>
                            </p>
                        </div>

                        <div className="h-px bg-white/10 w-full" />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-left p-4 rounded-lg bg-black/40 border border-white/5">
                                <div className="bg-white/10 p-2 rounded">
                                    <Download className="w-5 h-5 text-gray-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Dossiê Prime AI.pdf</p>
                                    <p className="text-xs text-green-500">Enviado com sucesso</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link href="/">
                        <Button variant="outline" className="mt-8 border-white/10 hover:bg-white/5 text-gray-400 hover:text-white">
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                            Voltar ao Início
                        </Button>
                    </Link>

                </div>
            </div>

            <Footer />
        </main>
    );
}
