"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EvolutionChart } from '@/components/ui/EvolutionChart';
import { useEvolutionHistory } from '@/lib/hooks/useEvolutionHistory';
import {
    TrendingUp,
    Calendar,
    Camera,
    ChevronRight,
    Clock,
    Trophy,
    Target,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EvolutionPage() {
    const { history, isLoaded, getChartData, getEvolution, canAddEntry } = useEvolutionHistory();
    const [chartData, setChartData] = useState<any[]>([]);
    const evolution = getEvolution();

    useEffect(() => {
        if (isLoaded) {
            setChartData(getChartData());
        }
    }, [isLoaded, getChartData]);

    const { allowed, daysRemaining } = canAddEntry();

    return (
        <main className="min-h-screen bg-[#050505] text-white font-sans">
            {/* Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-28 pb-20 space-y-8 relative z-10">

                {/* Header */}
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        Rastreador de Evolução
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Sua Jornada de <span className="text-primary">Transformação</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm">
                        Acompanhe seu progresso ao longo das semanas. Faça análises regulares para ver sua evolução.
                    </p>
                </header>

                {/* CTA para nova análise */}
                <div className={`p-6 rounded-2xl border ${allowed
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-white/5 border-white/10'
                    }`}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${allowed ? 'bg-primary/20' : 'bg-white/10'
                                }`}>
                                {allowed ? (
                                    <Camera className="w-6 h-6 text-primary" />
                                ) : (
                                    <Clock className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h3 className={`font-bold ${allowed ? 'text-white' : 'text-gray-400'}`}>
                                    {allowed ? 'Pronto para Nova Análise!' : 'Próxima Análise em Breve'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {allowed
                                        ? 'Registre seu progresso desta semana'
                                        : `Aguarde ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} para nova entrada`
                                    }
                                </p>
                            </div>
                        </div>

                        <Link href="/scan">
                            <Button
                                className={`${allowed
                                        ? 'bg-primary text-black hover:bg-primary/90'
                                        : 'bg-white/10 text-gray-400 cursor-not-allowed'
                                    }`}
                                disabled={!allowed}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                {allowed ? 'Fazer Análise' : 'Em breve'}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Evolution Chart */}
                <section>
                    <EvolutionChart
                        data={chartData}
                        evolution={evolution}
                    />
                </section>

                {/* Timeline */}
                {history.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Histórico de Análises
                        </h2>

                        <div className="space-y-3">
                            {history.map((entry, index) => {
                                const date = new Date(entry.date);
                                const isLatest = index === 0;
                                const prevScore = index < history.length - 1 ? history[index + 1].score : entry.score;
                                const change = entry.score - prevScore;

                                return (
                                    <div
                                        key={entry.id}
                                        className={`p-4 rounded-xl border transition-all ${isLatest
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Thumbnail ou ícone */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${isLatest ? 'bg-primary/20 ring-2 ring-primary' : 'bg-white/10'
                                                }`}>
                                                {entry.thumbnail ? (
                                                    <img
                                                        src={entry.thumbnail}
                                                        alt="Análise"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">📸</span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">
                                                        {date.toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                                                            MAIS RECENTE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                                    <span>Simetria: {entry.symmetry}%</span>
                                                    <span>Pele: {entry.skin}%</span>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${isLatest ? 'text-primary' : 'text-white'
                                                    }`}>
                                                    {entry.score}
                                                </div>
                                                {index < history.length - 1 && change !== 0 && (
                                                    <div className={`text-xs font-bold ${change > 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Motivational Section */}
                {history.length === 0 && (
                    <section className="text-center py-12 space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Target className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Comece Sua Jornada Hoje
                            </h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Faça sua primeira análise e volte semanalmente para acompanhar como seus esforços de looksmaxxing estão dando resultado.
                            </p>
                        </div>
                        <Link href="/scan">
                            <Button className="bg-primary text-black hover:bg-primary/90 px-8 py-6 text-lg">
                                <Sparkles className="w-5 h-5 mr-2" />
                                Fazer Primeira Análise
                            </Button>
                        </Link>
                    </section>
                )}

                {/* Tips */}
                <section className="bg-[#1C1C1E] rounded-2xl border border-white/10 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Dicas para Melhores Resultados
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-start gap-3">
                            <span className="text-primary">•</span>
                            <span>Use sempre a <strong className="text-white">mesma iluminação e ângulo</strong> nas fotos para comparações precisas.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-primary">•</span>
                            <span>Faça análises <strong className="text-white">no mesmo horário</strong> (ex: manhã ou noite).</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-primary">•</span>
                            <span>Siga seu <strong className="text-white">Plano de Ação</strong> consistentemente por 30 dias antes de esperar mudanças visíveis.</span>
                        </li>
                    </ul>
                </section>

            </div>

            <Footer />
        </main>
    );
}
